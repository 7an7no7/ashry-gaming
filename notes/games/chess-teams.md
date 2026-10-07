# شطرنج بالتصويت (id `votechess`) and المخ والإيد (id `handbrain`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **شطرنج بالتصويت and المخ والإيد (chess for teams)** - the owner's
  decisions of 24 Sep 2026 (`notes/archive/plans/BATCH4_RUNBOOK.md`, Decisions 1 and 2),
  rooms only, the TV optional (*شطرنج بالتصويت*, *المخ والإيد*):
  - **شطرنج بالتصويت**: two teams split by the host in the lobby (at random,
    then moves across), any number from 2 (1 vs 1 is chess by a vote of one).
    On a team's move every member taps a move on their own board; **the move
    with the most votes is played when the vote clock ends or every member
    present has voted; a tie is drawn at random among the tied moves.** The
    vote clock **30 s by default** (20 / 30 / 60, the host's). **Votes secret
    until the move is played** (who voted public, not for what), then the table
    sees how the team voted (♞f3 ×3, e4 ×1). **No computer players.** Nobody
    voted: the move with most votes, or a random legal move, said as such. The
    team chat is the room chat's team channel.
  - **المخ والإيد**: 2 vs 2, computer players (easy, hard) fill empty seats.
    On a team's move the **Brain** names a kind (♔ ♕ ♖ ♗ ♘ ♙, only kinds with
    a legal move lit), then the **Hand** plays any legal move of that kind.
    **Roles fixed for a game, swapped for the next.** A clock per team, **off
    by default**, 5+0 / 10+0. The Brain sees the board and can't move; the Hand
    sees the named pieces lit; what the Brain named is public.
  - Decided here (open to change, each in one place):
    - Vote chess: **resigning is a vote** (🏳️ beside the moves) that wins only
      with more votes than any move - a tie with a move plays the move, never
      a resignation by lot (`vcClose`). **Play again keeps the teams and swaps
      the colours**, a newcomer joining the smaller team and the last game's
      team chat dropped (its colours are the other side's now). A member who
      leaves drops out of the count (the vote may close on the spot); a team
      with nobody left loses. A latecomer watches and plays the next game. The
      host's "close the vote now" is decided by the votes so far.
    - Hand and Brain: the seats are the host's, like الدومينو's (people first
      at random, two taps swap two seats, an empty seat included; 🔀 draws
      again); **the empty seats are filled with easy computer players at the
      start**, named by the host's phone in its language; more than four people
      and the rest watch. **Play again swaps the roles and the colours.** A
      seated player who leaves mid-game: **a computer player (easy) takes the
      seat** («🤖 منى»: the name stays plain, the screens add the 🤖) so the other three can finish. Either member resigns
      for the team. The host's "play for" plays as an easy computer player. A
      Brain with one kind that can move has it named for them, and a Hand with
      one legal move of the named kind has it played - unless it ends the game.
    - The Brain's word in Arabic is «المخ (منى) قال: الحصان!»: the role is the
      subject, so the verb fits any name (a name doesn't say قال or قالت).
    - Both are in **ورق وطاولة** (Cards & table), beside لودو and بنك الحظ: a
      board game at the table; «لاتنين على موبايل» isn't true of them.
    - The icons are drawn (`art:votechess` a ballot with a pawn going into
      the box, `art:handbrain` a brain and the pawn it names).

### شطرنج بالتصويت

The owner's rules are in *The owner's specs*. Game id `votechess`, view
`room-votechess`, rooms only.

- **`RoomVoteChess.js`**: the lobby's split is `shared.lobby.sides` (`{ pid:
  0 | 1 }`; the host's `sides { shuffle }` draws it, `{ move: pid }` puts one
  across, `{}` keeps it in step with who is here - the host's phone sends that
  itself, `vcLobbySync`); `vcFitSides` never leaves a side empty. A game is
  `shared.teams` ([White ids, Black ids] - team k plays colour k), one board
  (`chessBoardNew('off')`), `shared.vote = { team, n, endsAt, voted }` - who,
  never what - and `shared.tallies` (the last 12 closed votes: the moves with
  their counts and SAN, the pick, and `how`: votes, tie, random, host). The
  votes are `room._vc.votes`, never projected; a voter's own is also
  `room.secrets[pid] = { vote, n }`, so a reload brings its arrow back. `vote
  { from, to, promo | resign, n }` (n the move count: a stale tap is dropped)
  may be changed until the close; `vcClose` runs when everyone present on the
  team has voted, on the clock (`vcDeadline` / `vcTimeout`, 0.4 s of grace)
  or on the host's `closeVote { n }`. `shared.tw` is each team's games won
  (swapped with the colours on play again).
- **`JS_RoomVoteChess.html`**: the chess screen (`chLayoutHtml`,
  `chViewShow`) with the duels' pills for the two teams (the members under
  each, a dot filling as each votes), the vote clock as a ring
  (`vcPaintClock`, the server's time through `serverNow` / `receivedAt` as
  the chess room reads it), the tally card that flies in once
  (`motionFirst`), 🏳️ «صوّت نستسلم» and the host's «اقفل التصويت دلوقتي».
  **A vote is the chess board's tap or drag, not a move**: `chTapLogic` /
  `chDropLogic` with a `play` that votes, and a drop returning `'pre'` so the
  piece goes back to its square and only the blue arrow (`CH_PRE_COLOR`)
  stays. The vote shows at once (`vcLocal.mine`) and is taken back if the
  server refuses it. The TV: the 3D board, both teams, the clock, the tally.
- The team channel: `roomChatTeam` in `RoomGames.js` (and `chatTeamOf` on the
  phone) gives a vote-chess player the team `w` / `b` (⚪ / ⚫ in the chat).
- Tests: `rules.mjs`, `leaks.mjs` (`DRIVERS.votechess`, `PROBES.votechess`),
  `play-all.mjs` (`teamChessRobots`).

### المخ والإيد

The owner's rules are in *The owner's specs*. Game id `handbrain`, view
`room-handbrain`, rooms only, computer players.

- **`RoomHandBrain.js`**: the lobby's seats are `shared.lobby.order`, four
  ids or null (White's Brain, White's Hand, Black's Brain, Black's Hand);
  `hbFitOrder` keeps the seats people have and seats newcomers in empty ones
  (people before computer players), the host's `seats { shuffle | order }`,
  `{}` in step with the room (`hbLobbySync` on the host's phone). At the
  start the empty seats get easy computer players (`hbFillSeats`, named from
  the host's `botNames`). A game is `shared.teams` ([[brain, hand], [brain,
  hand]] by colour), `stage` ('name' | 'move'), `named { kind, n, by }`,
  `calls` (the last ten names, for the log), one board with the clock chosen
  (`chessBoardNew('off' | '5+0' | '10+0')`: the clock is the team's), `tw`.
  `name { kind, n }` from the Brain up (a kind with no legal move refused),
  `move { from, to, promo, move }` from the Hand up (a piece of another kind
  refused), `resign { round }` from either member, the host's `skipTurn {
  move, stage }`. Nothing is hidden.
- **Computer players** (`ROOM_BOT_GAMES.handbrain`, max 4): a Brain names the
  kind of the engine's move (`hbBotKind`: 1500 on a small budget for hard,
  600 one ply deep for easy); a Hand plays the best move of the named kind
  (`hbBotMove`: a mate at once, else each move looked at one reply deep,
  captures followed, a few hundred positions a move; easy plays at random a
  third of the time). **Forced moves** (`ROOM_FORCED_GAMES.handbrain`): the
  only kind that can move is named; the only move of the named kind is played
  unless it ends the game.
- **`JS_RoomHandBrain.html`**: the chess screen; the pills say who is Brain
  🧠 and Hand ✋ of each team (the one up in the accent); the Brain's six
  buttons (`hbBarHtml`, drawn pieces, the kinds that can't move faded); the
  Brain's word big over the board («🧠 المخ (منى) قال: الحصان!», popping in
  and with a chime once per move, `hbCue`); every piece of the named kind
  that can move lit (`marks`, kind 'chance') on every board; the Hand's
  board takes only those (`hbModel`'s `onPick` / `onDrop` refuse another
  kind), and the Hand's move is drawn as the finger lifts (`hbLocal.early`,
  the duels' rule). The lobby's seats as two teams of two
  (`hbSeatsHtml`). The TV: the 3D board, the teams, the Brain's word, the
  clocks.
- Tests: `rules.mjs`, `leaks.mjs` (`DRIVERS.handbrain`), `play-all.mjs`.

**The review of 1 Oct 2026.** A reload, a late joiner or a TV coming on doesn't replay the end's sound and confetti, the last tally's reveal or the Brain's last call (`vcFirstSight`, `hbFirstSight`, through `duelRoomFirstSight`); a deal first seen mid-game still cheers when it ends.

### المخ والإيد: a wrong call taken back, a stronger Hand (the review of 1 Oct 2026)

- **The Brain may change the call** for `HB_RECALL_MS` (3 s, plus 800 ms for the network on
  the server) **or until the Hand touches a piece**, whichever comes first. `shared.named`
  carries `at` (the server's time) and `touched`; `shared.callSeq` rises on every call and
  every change. Actions: `recall { kind, n, call }` (the Brain of the side to move; the same
  call, its kind changed, `named.re`, the log's last entry too; the window is not lengthened)
  - **not** `rename`, which is the room's own "change my name" action and never reaches a
  game - and `touch { move, call }` (the Hand, as it picks up a piece of the named kind,
  sent once a call). The Hand's `move` carries `call`, so a move drawn for the old call is
  dropped quietly (the phone puts its board back). On the Brain's phone the six stay for the
  3 s with the call lit and a count (`hbRecallLeft`, `hbRecallTick`, `.hb-kind.is-picked`,
  `hb_change_hint`); the call card pops and chimes again on a change and says «غيّر رأيه».
- A computer Hand, and the move made for a person's Hand (`ROOM_FORCED_GAMES.handbrain`),
  wait out a **person's** Brain's window (`hbRecallWait`); their keys carry `callSeq`.
- **The hard computer Hand** looks two plies and 600 positions at each move of the kind
  named (it was one ply and 140), inside 90 ms for the whole decision, then one ply for the
  rest (`HB_HARD_NODES`, `HB_HARD_BUDGET_MS`). Measured over random middlegames: about 11 ms a
  decision, 130 ms at the worst.
- Tests: `rules.mjs`, "handbrain recall:".

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **991 «الكابتن» breaks the tie (vote chess)** - the owner: the host can tap a captain per
  team in the lobby; if not, one is drawn at random at the start. A tie goes to the captain's
  vote; if the captain voted for none of the tied moves (or didn't vote), the tie is drawn at
  random as before. (It replaces *a tie is drawn at random* above for a captain who voted.)
  Built: `shared.lobby.caps` ([White's, Black's], `captain { pid }`, the host's 🎖️ beside each
  name, a second tap takes it off, a captain moved across is dropped by `vcFitCaps`);
  `shared.captains` at the start (`vcPickCaptain`: the lobby's if still on that team, else
  drawn); in `vcClose` a tie whose captain voted for one of the tied moves is `how: 'captain'`
  with `tally.captain` («🎖️ تعادل في الأصوات: الكابتن (…) حسمها»). Chosen here: resigning still
  needs a clear majority (a captain's 🏳️ never wins a tie); a captain who leaves - another
  member is drawn; play again keeps the captains with their teams (their colour swapped). The
  captain's chip wears a gold band and 🎖️ under the team's pill (`.vc-mem.is-cap`), in the
  lobby too, on the phones and the TV. Tests: `rules.mjs` "votechess captain:", `play-all.mjs`.
- **996 your vote, visible** - under the board a voter sees «🗳️ صوتك: ♞f3 · تقدر تغيّره» with
  ✕ (`vcMyVoteHtml`, `.vc-myvote` in the premove blue); ✕ is `unvote { n }` (`vcUnvote`, drawn at
  once and put back if refused): the vote, its arrow, the secret slice and the dot go, and the
  vote stays open. The status then says «✅ صوتك اتحسب، مستنيين الباقيين» (`vc_voted_wait`).
  Tests: `rules.mjs` "votechess unvote:", `play-all.mjs`.
- **1004 the role on the top line (المخ والإيد)** - a seated phone's first line is always its
  role and its job (`hbRoleHtml`): «🧠 انت المخ - سمّي قطعة», «✋ انت الإيد - حرّك الحصان» in the
  accent when it is your job now, and dimmed while you wait («- الإيد بتحرّك», «- استنى المخ»,
  «- استنى دور فريقك»). The status no longer repeats your own job (only a check), and the
  Brain's «الإيد بتاعتك بتحرّك… استنى» line under the board went (the role line says it). Not on
  the TV (it sits nowhere).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
