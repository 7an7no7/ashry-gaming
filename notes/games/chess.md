# شطرنج (id `shatranj` on the page, `chess` in rooms), الوزير المستخبي included

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **شطرنج (Chess)** - the owner's spec of 23 Sep 2026, asked one question at a
  time, then the computer's strength and the coach added the same day
  (*شطرنج*):
  - **Three ways**: **a room duel with the TV** (the duels' winner stays on:
    two play, the rest watch on their phones and the TV; the challenger has
    White), **against the computer**, and **two on one phone**. In the duels'
    section (`group: 'duo'`), `modes: ['device', 'room', 'tv']`.
  - **2D or 3D, the player's choice** (the owner, 24 Sep 2026: "the option to
    play it normal, same look as in chess.com, so it's optional"): **2D by
    default on a phone**, «🧊 3D» / «▦ 2D» on every board (one phone, a room's
    phone, the review) keeping the game, the piece picked up and the arrows,
    remembered on the phone; **the TV keeps 3D** and has no switch; three.js is
    never loaded while a phone stays in 2D. The 2D board is chess.com's kind:
    green `#769656` / cream `#eeeed2`, the last move's squares yellow, legal
    moves as dots and captures as rings, the coordinates in the edge squares'
    corners, a 0.15 s slide, and **our own drawn piece set** (never a copied
    one). **Four board styles**, «أخضر» (the default), «خشب», «أزرق», «رخام»,
    for both boards: in the setup and behind the board's ⚙. The 3D board got
    the owner's list: a lift, an arc and a settle for every move (a knight
    hops higher), a capture knocked over away from the attacker with a puff of
    dust, a red pulse under a king in check, a slow topple and a thud on mate
    with the camera easing in, castling as one movement, a promotion rising in
    a sparkle; finer pieces (smoothed profiles, a green felt, a carved knight
    with mane, ears and eyes, a bevelled cross), real grain, a varnish, a
    bevelled frame, soft contact shadows; and the camera in the player's hands
    (two fingers or a right/middle mouse button turn it, a pinch or the wheel
    zooms, «⬇ من فوق» and «↺»). A room or a table around the board was offered
    and not chosen.
  - **The look: real 3D "like bowling and golf"**: a wooden board (maple and
    walnut, the frame with a-h and 1-8) and Staunton pieces turned on a lathe
    (a pawn's collar and ball, a rook's battlements, the cut in a bishop's
    mitre, a carved knight's head, the queen's coronet, the king's cross),
    seen at an angle from your side; a move slides (a knight hops), a piece
    taken is knocked off and set beside the board, the king in check glows
    red, the last move's squares are tinted; tap a piece for its moves (a dot,
    a ring round a capture), tap a square - or drag. A flat board where 3D
    can't draw. Squares a-h / 1-8 (`dir="ltr"`).
  - **A chess clock, off by default**: off, 1+0, 3+0, 3+2, 5+0, 10+0,
    15+10 (minutes + seconds a move; 1+0, 3+0 and 15+10 added in batch 2) -
    the host's choice in a room, a setup choice on one phone. **Running out loses, unless the other side has nothing to mate
    with: then a draw.**
  - **The full rules**: castling both ways with every condition, en passant,
    promotion with a choice of four, check, mate, stalemate, threefold
    repetition, the fifty-move rule, insufficient material; a draw offered
    (the other accepts or refuses) and resigning.
  - **In a tournament** (the duels' tournament, plugged in 23 Sep 2026 with the
    owner's decisions of that day): exactly like the other duels - the lobby
    switch from four people, the matches of a round at once, random byes, the
    bracket, the podium, a new tournament or back to winner stays. **A drawn
    game is replayed once with the colours swapped; drawn again, one
    Armageddon game where a draw counts as a win for Black** - said on the
    phones and the TV («إعادة بالألوان معكوسة», «أرماجدون: التعادل للأسود»).
    **The host's clock runs per match** (off, 3+2, 5+0, 10+0; a flag ends that
    match only), draw offers and resigning work per match, your own match
    comes up by itself on the 3D board (your colour at the bottom), anyone
    watches any match, every game you played is kept for the review, and the
    TV shows the bracket with a small flat board and both clocks for every
    match being played (the big one, the host's pick or the last match left,
    on the 3D board). In winner stays a draw is the duels' draw: the champion
    keeps the seat.
  - **The host's "play for"** (decided here, in winner stays and in a
    tournament's match): after 40 seconds on one move, or at once for a phone
    that's away, the host can have **the computer play one move** for the side
    to move - an ordinary move at a low rating (800, one move deep, a few
    hundred positions: `chessHostMove`), never the engine's best, since it is
    the player's game and not the host's, and cheap enough for the server's
    free-plan time. With a clock on, running out is the other way on.
  - **The computer has a rating, 400 to 2000 in steps of 100** (replacing
    easy / medium / hard), a slider with a name for each band - مبتدئ 400-700,
    متوسط 800-1200, قوي 1300-1600, خبير 1700-2000 - remembered on the phone.
    The strength really follows the number: 400 looks one move ahead with no
    look at the captures after it (so it leaves pieces hanging and grabs
    defended ones), wobbles its judgement by up to two pawns and plays a
    random move a quarter of the time; each step looks deeper, at more
    positions, wobbling and slipping less; 2000 searches up to 1.5 s with none
    of it (`chessEloSettings`).
  - **The coach**, a setup switch, off by default, remembered:
    - **Live, against the computer only** (it would be unfair against a
      person): a **warning before a blunder** ("استنى! الوزير بتاعك على d4
      ممكن يتاكل"), take it back or play it anyway; a **hint** button (the
      best move as an arrow on the board, and why in one line); **a word after
      each of your moves** (best / good / inaccuracy / mistake / blunder, why,
      and the better move); **the pieces in danger** marked (attacked and not
      defended, or attacked by something cheaper: yours red, theirs green).
      Each can be switched off in the coach's settings; all on with the coach.
    - **A review after every game** - against the computer, two on one phone,
      and a room's once it is over, on each phone: every move rated
      (brilliant / best / good / inaccuracy / mistake / blunder) with the
      better move and why, an **accuracy for each player**, **the evaluation
      as a graph**, the game **replayed on the board with jumps to the key
      moments** (turning points, missed chances, brilliant moves), and **"try
      the better move"**: from that moment the better move is played and you
      carry on against the computer.
    - **The reasons come from the position**, templated sentences in Arabic
      and English from what the engine sees - a piece left hanging, a fork, a
      pin, a mate allowed or missed, material won or lost, the king's safety,
      development and the centre in the opening - never filler.
    - The analysis is worked out a position at a time with a progress bar, so
      the page never freezes; **the last 20 games are kept on the phone** and
      their reviews open from the chess setup screen.
  - Decided here (open to change, each in one place):
    - **Your colour at the bottom** (against the computer and on your own
      phone in a room; watchers and the TV see White at the bottom). **Two on
      one phone: White at the bottom, not turned every move** - a board that
      spins round after each move is hard to follow and loses the last move,
      and the phone is usually passed, not sat across; a ↻ button turns it any
      time. The colours swap every game there, as the duels' first move does.
    - **Threefold repetition and the fifty-move rule end the game by
      themselves** (as on every app a family plays on), rather than waiting
      for a claim.
    - **The clock starts with Black's first move** (White's first move is
      free, as online) and a move reaching the server up to 0.6 s after the
      time ran out still counts (the network's share, `CHESS_GRACE_MS`).
    - **Legal moves are always shown** for the piece you pick up (no switch),
      and the last move and check always marked.
    - **Promotion is a small picker over the square**: queen, rook, bishop,
      knight, or ✕.
    - **A single legal move is never played for you**: the move is the game
      and a player is meant to find it unaided - the standing "one thing to do
      is done for you" rule's own exceptions (*Decided, and why*), like the
      duels' last move.
    - A draw offer: once a move each; the other accepts or refuses, and
      making a move instead says no. Resigning asks first. On one phone a draw
      is both agreeing (a confirm), against the computer there is none.
    - The move list is in figurine notation (♞f3) - the same in both
      languages.
    - In a tournament's Armageddon both keep the match's clock, and White is
      drawn by lot (`chessMatchNext`).
    - The TV shows no review (the owner called it optional); the phones do.
  - **Batch 2** - the owner's decisions of 24 Sep 2026 (approved as a list;
    the choices marked "Claude's" were proposed and kept, each one place in
    the code):
    - **Opening names** as you play (a line over the move list, one phone, a
      room, the TV) and in the review («خرجت من النظرية في الحركة 7»), about
      150 openings in both languages, matched by position so transpositions
      work; never in a 960 or set-up game.
    - **Your rating**: 800 to start, a normal Elo (K 32 for the first 20 rated
      games, then 20) against the computer's rating. **Only games with no
      help count**: no undo, no hint, no best-move arrows, no coach warning,
      not from a set-up position, no handicap; Chess960 counts. The setup
      says before the game whether it will count and why not. A new game
      started over an unfinished rated one asks first and counts it as a
      loss (chess.com's rule), and so does resigning.
    - **Undo and hints against the computer**: unlimited / 3 a game / none,
      **3 by default**, remembered. Undo takes back your move and the
      computer's; the hint no longer needs the coach; each is counted and
      shows what is left («↶ 2»).
    - **Six characters** beside the slider (Claude's): «نونو» 400 (just
      learning), «عم حسن» 800 (attacks, loves checks), «ميرا» 1100 (solid,
      trades), «الكابتن» 1400, «الأستاذ» 1700, «الجنرال» 2000; a drawn face
      each, one line, and a suggestion near your rating + 100; the slider
      stays as «مخصص».
    - **Set up a position** (an editor: a palette, whose turn, castling where
      valid) **and eight famous endgames** (K+Q, K+R, K+P, two bishops,
      bishop and knight, Lucena, Philidor, Réti's pawn race), each with a line
      of what to do; checked before play; never rated.
    - **Chess960, handicap and the new clocks everywhere**: against the
      computer, two on one phone, room duels and the tournament (the host's
      lobby choice) - **except handicap, which a tournament doesn't have**.
      The handicap (Claude's): none, the f-pawn, the b-knight, the a-rook
      (castling that side lost) or the queen, or half the clock; against the
      computer you choose who gives it, two on one phone White or Black, in a
      room **the champion** gives it (with exactly two, the last winner; the
      first game none).
    - **Premoves**: only against the computer and on your own phone in a
      room. One, a blue arrow, played the instant it is your turn if still
      legal, dropped with a shake if not; a tap anywhere else cancels.
    - **Arrows and marks by hand**: ✏️ on the board for a finger; on a
      computer a right-drag draws an arrow and a right-click marks a square -
      **in 3D with Shift**, since a right-drag turns the 3D board (decided in
      batch 2 part C2: the 3D camera came first). Green; the same again takes
      it away; gone when a move is played; never sent to a room.
    - **Board styles** (done with the 2D board, above).
    - **Sharing a game**: a picture of the final position (the share card with
      a board on it), the PGN (copied, or the share sheet), and a short replay
      video where the phone can record a canvas (0.6 s a move, 20 s at most),
      the button hidden where it can't.
    - **Best-move arrows**: a coach switch «أفضل الحركات», **off by default**,
      against the computer only: on your turn the top 3 moves as arrows
      (green, lighter green, yellow), each labelled with your winning chance
      («64%»), and «فوزك لو لعبت: ♞f3 64% · e4 61% · d4 58%» under the board.
      Using it makes the game unrated.
    - Decided while building (open to change, each one place): a handicap
      on a 960 row takes the f-pawn, the knight or rook nearest the a-file, or
      the queen (`chOddsFen`); in 960 a king step and castling that land on
      one square - a tap on the square is the step, castling is by the rook
      (`chTapLogic`); a premove offers the piece's moves on an empty board
      (Lichess's way) and a pawn premoved to the last rank becomes a queen
      (`chPremoveTargets`); the best moves are five candidates from a short
      look, each searched in a tick of its own, the best three kept
      (`CH_BEST`); the share card and the video put ⚪ / ⚫ before the names
      (the chess glyphs become emoji on an iPhone).
  - **The board like chess.com, 2D or 3D in plain sight, looking back, and
    premoves as a switch** - the owner's requests of 24 Sep 2026, all decided:
    - **The 2D set redrawn, our own** (never chess.com's art): classic
      Staunton silhouettes that fill the square - the king about 90% of its
      height, queen, bishop and knight 88%, the rook 85%, the pawn about three
      quarters - with bold dark outlines; White near-white with a charcoal
      outline and a light-to-shade gradient, Black near-black with a thin
      lighter rim inside its outline so its shape reads on a dark square; a
      soft small shadow under every piece. The board's colours and four
      styles unchanged; the coordinates bold, in the corners, in the other
      square's colour; legal moves a dark translucent dot (30% of the square),
      captures a ring; the last move yellow; a square under a dragged piece
      (or a mouse, on your move) a subtle white inner outline; the dragged
      piece bigger with a shadow. The share card's canvas board uses the same
      drawings; شطرنج الأربعة draws the new shapes in its colours. 3D untouched.
    - **«2D | 3D» is a segmented switch** in the board's row of buttons (where
      the small «🧊 3D» chip was) and on the one-phone setup under «شكل
      الرقعة», beside the styles; one remembered choice (`chLook().view`), gone
      where 3D can't draw; the TV has none (it is 3D).
    - **Undo is real, or not there**: ↶ and 💡 against the computer are drawn
      only when the setup allows them (not «ممنوع»); two on one phone has no
      undo (as built - it already worked so; checked).
    - **Looking back is not undo** (the owner: "when it's off, it's the same
      as chess.com - it shows me what happened in case I missed it, it doesn't
      affect the real game"): ⏮ ◀ ▶ ⏭ under the board, ← / → on a computer, a
      tap on a move in the list - against the computer, two on one phone, and
      on every phone in a room (players and watchers; the TV skips it). The
      board shows that position with its move's yellow squares; nothing can
      be moved; the clock runs on; «👀 بتتفرج على الحركة 12 ♞f3 · ارجع للعبة»
      takes the status line's place, over the board; it, ⏭ or a tap on the
      board is the game again. A move played meanwhile leaves you where you
      are and the line pulses. The game, its record, the clock and the rating
      are never touched.
    - **«الحركات المسبقة» (Premoves) is a switch, on by default**, on the
      setup (near undo and hints) and in the board's ⚙, remembered on the
      phone; obeyed against the computer and on your own phone in a room.
      Off: nothing is queued and a tap while it isn't your move does nothing.
    - Decided here (each one place): the "move 12" is the full-move number
      with that move's SAN after it (the list numbers moves in pairs); the
      line replaces the status rather than being added over it, so the board
      doesn't jump down on a phone; while looking back the board has a frame
      in the screen's colour, so it isn't taken for the game; a premove
      queued before looking back still plays when your turn comes (the game
      goes on); switching premoves off drops one already queued.
  - **الوزير المستخبي (Hidden queen)** - the owner's decisions of 24 Sep 2026,
    asked one by one (*شطرنج*, "The hidden queen"):
    - **A room duel** (winner stays; each on their own phone, the TV
      optional) **and against the computer**. Not two on one phone (the secret
      can't be hidden there) and **not in the duels' tournament**: the lobby
      hides the choice while the tournament switch is on, and says so.
    - **The pick**: before the first move each player taps one of their own
      pawns. With the room's clock on, the pick has its own clock, 60 seconds
      (خمّن مين's), and an unpicked player gets a random pawn; the host's
      "play for" picks at random too. Against the computer you pick, the
      computer at random.
    - **Until revealed it is a pawn for everything the other side sees or is
      affected by**: it attacks only as a pawn, never gives check, never keeps
      the other king off a square, and the other side's legal moves never
      depend on it. Its owner moves it like a pawn (it stays hidden, the secret
      following it) or like a queen from its square - any queen move a pawn
      couldn't make - which reveals it: a real queen on the board, capturing
      or checking like any queen, never taking a king. A queen move a pawn
      could also make (a step, the double step, a diagonal capture) is a pawn
      move.
    - **Reaching the last rank still hidden** it promotes like any pawn (the
      choice of four) and the secret is gone, told to nobody until the game
      ends. **Captured while hidden** it is revealed ("👑 كان الوزير!" on
      every screen) and counts as a queen.
    - **At the end both picks are shown.**
    - The look: a third choice in «🎲 نوع اللعبة» (عادي / 960 / «👑 الوزير
      المستخبي»), its own hint line shown only when it is picked; a gold crown
      on the hidden pawn on its owner's phone only; «اختار العسكري اللي هيبقى
      وزيرك المستخبي» with your pawns lit while picking; the reveal a moment on
      every screen (the pawn turning into a queen with a pop, «👑 وزير
      مستخبي!»); a revealing move written as a queen move with 👑.
    - **Never rated, no handicap with it**; 960 and the hidden queen are one
      choice (`variant`: 'standard' | '960' | 'hq').
    - Decided while building (each in one place):
      - **A mate or a stalemate is judged with the hidden queen's moves too**
        (`chessHqPlay`): a side whose only way out is its hidden queen isn't
        mated - the game going on is a tell the rules can't avoid (the SAN's
        # becomes +).
      - **A pick is final**: one tap picks, a second on the same pawn (or the
        button) confirms, and it can't be changed.
      - **The handicap is not offered with it** (hidden on one phone, the lobby
        and the server ignore it), and a remembered hidden queen starts a
        tournament standard.
      - **The computer** considers its own hidden queen's moves at the root of
        its search only (deeper, every hidden queen is the pawn it looks like),
        in the same time and node budget; it never knows yours. The host's
        "play for" may use the hidden queen (the same search, cheap).
      - **The review** plays a revealing move as the queen's (stored `e2e5*`);
        its positions show the pawn until it moves. The coach, the hint and
        the best-move arrows read the board as it looks (hidden queens are
        pawns), so they never suggest a hidden queen's move; a premove of it
        is a pawn's.
      - Nothing ticks while picking on one phone (you are alone); the chess
        clock starts, as always, with White's first move.

### شطرنج

The owner's rules are in *The owner's specs*. The game's client id is
**`shatranj`** (the catalog, the help, `setup-shatranj`, `play-shatranj`,
`review-shatranj`) and the room's is **`chess`** (`ROOM_GAME_IDS`,
`room-chess`, `ROOM_GAMES.chess`, `TV_GAMES.chess`): `chess` was already the
chess clock tool's help entry and `play-chess` its screen, so the room's help
goes through `ROOM_HELP_KEY` in `JS_Utils.html` (*Traps*).

- **`Chess.js`** (shared, no DOM, every name `chess` / `CHESS_`; inlined into
  the page through `SHARED_LISTS` and bundled into the Worker):
  - **A game** is one plain object (`board` 64 numbers a1 = 0, a piece its
    kind 1-6 + 8 for black; `turn`, `castle` bits, `ep`, `half`, `full`, and
    `keys`, the positions since the last capture or pawn move for threefold -
    a position's key has an en passant square only when a pawn can really
    take there). `chessPlay(g, { from, to, promo })` plays a legal move and
    says what happened (SAN, what was taken and where, castling, check, and
    `status`); `chessStatus(g)` is mate, stalemate, material, repetition or
    fifty; `chessLegalMoves`, `chessFen` / `chessFromFen`, `chessCheckSq`.
  - **Inside**, a position (`chessPos`) with the kings and a two-lane Zobrist
    hash, pseudo-legal generation over precomputed knight, king and ray
    tables, make / unmake, and a legality filter. `rules.mjs` runs perft on
    the standard positions: the start to depth 4 (197,281), Kiwipete to 3
    (97,862), positions 3 (depth 5, 674,624), 4, 5 and 6 - all in well under
    a second.
  - **The clock**: `chessClockNew(id)`, `chessClockLeft`, `chessClockPress`
    (the first move free, the increment added), `chessClockFlagged`,
    `chessFlagResult` (a flag against a side that can't mate is a draw:
    `chessCanMate` - a lone king can't; a lone minor or bishops of one colour
    only when the other side has something to block with).
  - **The computer** (`chessBestMove(g, { elo })`): iterative-deepening
    alpha-beta with a transposition table, MVV-LVA captures, killers and
    history, a check extension, a null move, late moves searched shallower,
    quiescence, the "simplified evaluation" piece-square tables tapered to the
    endgame, and a push of a bare king to the edge. It stops at its time **and**
    at a node ceiling (a frozen clock can't hold it - *Traps*), keeping the last
    depth it finished (depth 1 always finishes). The rating is
    `chessEloSettings(elo)`: depth, nodes, ms, the wobble on each root move
    (`noise`), the chance of a random move (`blunder`) and how far the
    captures at the leaves are followed (`qdepth`, 0 at 400).
  - **Stockfish does the coach's and the review's looks** (the owner, 4 Oct
    2026: "build it with stockfish for the coach and review"). Stockfish 19
    lite, single-threaded (`vendor/stockfish/`, GPLv3, 1.8 MB; `g/sf19-lite.*`,
    downloaded with the offline copy) in a Web Worker: `JS_ChessStockfish.html`,
    `chSfAnalyse(g, { nodes, lines, hq })` → a promise of chessAnalyse's shape
    with `sf: true`, or null (then the app's own engine). One worker, one
    question at a time; `go nodes` (`CH_SF`: coach 150k, best arrows 200k with
    three lines, review 120k per position - on this PC depth 12-17, a 50-move
    game in 1.4 s, Stockfish reusing its hash from position to position); a
    small memo by FEN. Not for الوزير المستخبي or Chess960 (`chSfFits`), and
    off for the visit after any failure (`chSfFail`: no Worker, no
    WebAssembly, the file, 30 s without an answer). The coach is now async:
    `chCoachAnalyse`, `chCoachPrepare` (`coachAsking`), `chCoachJudge` → both
    looks → `chCoachVerdict` (the computer waits for the verdict; a board left
    or a move taken back meanwhile drops it), `chHint` (`hintAsking`),
    `chBestPrepare` (three lines in one search, sorted best first). The review
    (`chReviewRun`, a run token `chRv.run`) asks Stockfish for every position,
    then judges; `chessJudge` takes Stockfish's looks as they are (no
    side-by-side re-check). A kept review says `engine: 'sf' | 'app'`; one by
    the app's engine is worked out again once Stockfish can (`chReviewFresh`),
    and the review shows «🐟 حلّلها Stockfish 19». **The computer you play
    against stays the app's own engine** (its ratings 400-2000), so do the
    puzzles made from mistakes and the rooms server.
  - **The coach's analysis**: `chessAnalyse(g, { nodes })` (the best move, the
    score for the side to move, mate in n, the line it expects), `chessJudge`
    (one move against the analyses before and after it: the verdict from the
    centipawns lost, a score held within ±1000 so a won game stays won -
    best ≤ 15, good < 50, inaccuracy < 100, mistake < 300, blunder from 300; a
    mate let slip is at least a mistake, one walked into a blunder; a best
    move that leaves a piece to be taken for less is **brilliant** - and the
    accuracy by Lichess's formula from the winning chances lost). **A move that
    looks worse is weighed again** (4 Oct 2026, the owner: "it says blunder on
    moves that aren't"): the analyses before and after a move are two separate
    searches, and the one after sees a move further, so a threat the engine's
    own move ran into too read as the played move's fault (and a mate coming
    whatever was played made any move a "blunder"). When a move loses more than
    `good`, or lets a mate in or slips one, `chessCompareMoves(g, [best,
    played], { nodes: 2 × the analysis' })` scores both at the root of one
    search to one depth, full window each, and that is the verdict. Measured
    over 251 doubtful moves against a search forty times as deep: verdicts two
    steps off went from 42 to 16, exact ones from 127 to 153 (the same count of
    nodes only 27 / 140; four times 15 / 152). The review judges a move as a
    step of its own (`chessReviewStep`, `rv.judged`, `chessReviewDone` for the
    bar), and a kept review carries `v: CHESS_REVIEW_V` (2): an older one is
    worked out again when it is opened. The live coach passes its own budget
    (`CH_COACH_NODES`, 900 ms),
    `chessMoveGood` / `chessMoveBad` (the reasons, as keys and facts: `hang`,
    `fork_allowed`, `pin_allowed`, `mate_allowed`, `loses`, `mate_missed`,
    `win_missed`, `king_walk`, `queen_early`, `castle_better`,
    `develop_better`, `centre_better`, `better`; `mate_in`, `fork`, `wins`,
    `saves`, `castle`, `develop`, `centre`, `check`, `improves`, `sacrifice`),
    `chessThreats` (the pieces in danger), `chessPins`. A review is
    `chessReviewBegin(record)` → `chessReviewStep` a position at a time →
    `chessReviewResult` (every move judged, the accuracies, the graph, the key
    moments); `chessReview` does it all at once for the tests. Bounded by
    nodes, the same game reviews the same every time.
  - **The tournament's adapter**: `chessMatchNext(match, rnd)` - the next game
    of a match (White, Armageddon or not) or its winner - and
    `chessArmageddonResult`.
  - **Batch 2's rules** (standard chess bit for bit as before - the perft
    numbers unchanged): **Chess960** - a game carries its castling rooks'
    files (`g.rooks`, `[wK, wQ, bK, bQ]`, standard `[7, 0, 7, 0]`) through
    `chessFromFen` / `chessPos` / `chessCloneGame` / `chessFen` (X-FEN),
    castling to g/c with the rook to f/d, a castling move also accepted as
    "the king takes its own rook" (`chessFind`); `chess960Start(n)`
    (Scharnagl numbering, 518 is the standard start) and `chess960Random`;
    Chess960 perft positions in `rules.mjs`. **Several lines**:
    `chessAnalyse(g, { lines: n })` returns `lines`, the top n root moves with
    their scores. **A style** for the computer: `chessBestMove(g, { elo,
    style: 'attack' | 'solid' })`, a bonus at the root only (never in
    `chessEvaluate`, so the analysis and the review are unchanged). **The
    clocks** `1+0`, `3+0`, `15+10` in `CHESS_CLOCK_IDS`; **the handicap**
    `chessHandicapFen(kind, side)` and `chessClockNew(id, { odds })` (the
    giver's clock halved).
- **`RoomChess.js`** (bundled after `RoomDuels.js`, whose line and seats it
  uses). **One board** is `shared.chess`, made and played only through the
  board functions, which never touch the room, so a bracket can hold one per
  match: `chessBoardNew(clockId, { armageddon })`, `chessBoardMove(bd, seat,
  payload, now)`, `chessBoardResign`, `chessBoardOffer` / `chessBoardAnswer`,
  `chessBoardDeadline`, `chessBoardFlag`; a board's `result` is `{ result,
  reason, winner (the seat), drawn }`, an Armageddon draw coming out as
  Black's win. The board keeps `hist` (the moves as 'e2e4', for the review),
  `sans`, `lost` (what each side has lost), `last`, `offer` / `offered`, the
  clock in the server's time. The room around it is `chessAction` (winner
  stays on through `duelEnd` / `duelSeatNext`), `chessDeadline` /
  `chessTimeout` (the flag), `chessPlayerLeft` (a forfeit). A move carries
  `move` (the count the phone saw) against a double tap; a move that arrives
  after the time ran out loses on time and isn't played. No computer players,
  no forced moves. The host's `skipTurn` plays one move for the side to move
  (`chessHostMove`: `chessBestMove` at 800, depth 1, 600 positions, marked
  `last.auto = 'host'`), carrying `move` against a double tap.
  **Batch 2**: `chessRoomOptions` is `{ clock, variant: 'standard' | '960',
  odds }`; `chessBoardNew` takes a start FEN and keeps `bd.start` (the kept
  game's record and its review use it); a 960 room draws a new start each game
  (a tournament one per match, `m.start960`, kept through its replay and
  Armageddon); the handicap comes off **the champion's** side, and a
  tournament ignores it. An old phone sending only `clock` keeps what the
  room had (a new room: standard, no handicap).
  `chessBoardDeadline` is the first moment the flag counts (the grace + 1 ms:
  `chessClockFlagged` wants *more* than the grace, and an alarm at the grace
  itself found nothing to do).
- **In the tournament** (`TOUR_KINDS.chess` in `RoomTournament.js`): `deal`
  makes a board through `chessRoomDeal(v, { armageddon })`; the match keeps
  `whites` (who had White in each game, public) and `chessMatchNext` (from
  `chessTourRecord(m)`) says the next game's White and whether it is
  Armageddon - the second game is the swap the tournament's own replay already
  makes, the third has White by lot, and the seats are turned when the lot says
  so. `drawRule` asks `chessMatchNext` too: a draw is replayed until it says
  the match is decided (an Armageddon draw never reaches it - the board
  already made it Black's win, `result.drawn`). `act`, `deadline` / `timeout`
  (the flag), `left` and `stay` are chess's own room functions on the match's
  small room; `chessAction` hands every action to `tourAction` first.
  On the page (`JS_RoomChess.html`) everything reads the room through
  `duelRoomState()` and sends through `duelAct()`, so the same screen draws a
  match; `chRoomTagHtml` says «إعادة بالألوان معكوسة» or «أرماجدون: التعادل
  للأسود» over the status, an Armageddon draw's result line says Black won it,
  `chRoomKeepTourGames` keeps every game the phone played as it ends (the
  final ends on the podium, not the board), and `chRoomLiveState` /
  `chRoomPaintMiniClocks` keep the big board's clocks and the TV's live cards'
  ticking. `TOUR_CLIENT.chess` (in `JS_RoomTournament.html`, which loads after
  this file) is the live card - a flat `chFlatBoardHtml` without coordinates,
  both clocks, ⚔️ on Armageddon - and the optional hooks the tournament gained
  for it (`liveSig`, `replayHead`, `drawNote`, `after`, `onState`).
- **`JS_Chess.html`** - the board and one phone:
  - **One board view per page** (`chView`, as `bsView`): a root moved into
    whichever screen shows a board, thrown away when none does. The 3D board
    (`chMake3D`) draws **only when something changes or moves**: a tween list
    and a drag keep the loop running, nothing else (a static board costs
    nothing). The board top is one canvas texture (the squares' grain, the
    frame, the names turned to whoever sits at the near side), what sits on
    the squares another (the last move, the piece picked up and its targets,
    check, the pieces in danger, arrows - redrawn only when it changes), the
    pieces lathe profiles plus their parts (battlements, the mitre's cut, the
    extruded knight's head turned three-quarters so its profile reads, the
    coronet, the cross), boxwood and ebony `MeshPhysicalMaterial` with a
    lacquer under a warm room of light (PMREM), soft shadows, and a shadow
    catcher under the board on the page's own ground. The camera finds the
    nearest distance that shows the frame, the far pieces' tops and the pieces
    taken (beside the board on a wide screen, before and behind it upright),
    from your side. A move is a tween from where the piece is (so a dropped
    piece slides from under the finger), a capture knocks the piece off in an
    arc to its place beside the board, castling brings the rook after, a
    promotion pops the new piece in, check shakes and lights the king, mate
    topples it. Picking tries the height of a piece's middle first (a tall
    piece stands in front of the square behind it).
  - **The 2D board** (`chMakeFlat`, `chFlatBoardHtml`, section 30 of
    `Style.html`): the squares a CSS grid, the pieces a layer over them, each
    a `<use>` of a `<symbol>` (`chPieceSymbols`, put in the page once by
    `chPieceDefs`: our own Staunton drawings, `CH2_SHAPES`, in a 45 × 45 box)
    placed with `transform: translate(var(--x) × 100%, var(--y) × 100%)`. The
    live board is built once per orientation and updated square by square
    (`ch2SquareParts`); a move moves the piece's element (a 150 ms Web
    Animation of its transform), a piece taken fades under it, the rook comes
    with its king, a promotion pops, a mated king tilts; a drag lifts the
    piece (`is-drag`) and a refused drop shakes it back (`dragEnd(played, to,
    refused)`); a piece the finger dropped is not slid again when the move
    comes back (`dropped`). The static callers draw the markup as it is: the
    position editor and the tournament's live cards (`mini`: no
    coordinates). The colours are tokens: `--ch2-light` / `--ch2-dark` /
    `--ch2-last` / `--ch2-sel` per `[data-ch2-style]`, the pieces'
    `--ch2-w-*` / `--ch2-b-*` on `:root`, the same in both themes. The 3D
    board's four styles are `CH3_STYLES` (`applyStyle` recolours the
    materials and redraws the board's canvas).
  - **The pieces** (24 Sep 2026, "like chess.com"): `CH2_SHAPES` built from
    `CH2_BASE`, `CH2_BAND`, `CH2_SKIRT`; `chPieceSymbols` writes each shape as a
    filled, outlined body for White, and for Black the fill, a rim (the same
    shape stroked with `--ch2-b-rim`, clipped to itself by a `clipPath` per
    shape, `ch2k-<kind>-<n>`) and the outline over it; an ellipse under every
    piece filled with the radial `ch2sh` is its shadow. Only the types
    `b c l d dc` exist, so `ch4PieceDefs` (شطرنج الأربعة) keeps reading the
    same list. `chBoardColours` reads `rim` too, for the share card's canvas.
  - **The look and the switch** (`chLook`, `recallOptions('chessLook')`: `{
    view: '2d' | '3d', style, premove }`; `chLookSet` remembers and redraws -
    a premove change repaints the one-phone or room screen and drops a queued
    one; «2D | 3D» is `chViewSegHtml` / `chViewSet` on the board and
    `#shatranj-view` on the setup; the ⚙ (`chToolsPop`) shows the premove
    switch when the model says `preable`):
    `chViewShow` asks `chViewWant` (the TV's model `tv`, or the phone's
    choice, and only where `chCan3D`); a 3D board shows the 2D one while
    three.js loads (`chViewLoad3D`, the one place chess asks for it), a load
    that fails leaves 2D and hides the switch (`chView.no3d`). The board's
    buttons are `chViewTools` (`.ch-tools`, a row over the board, a column
    beside it when the stage is wide - a container query on `.ch-view`).
  - **The 3D polish** (24 Sep 2026): profiles smoothed between their sharp
    corners (`chPieceParts`' `smooth`, 64 segments), a felt disc under each
    piece, the knight's head the 2D knight's own profile (`CH3_KNIGHT`,
    `ch3KnightPt`) with a ridged mane, ears, eyes and nostrils, turned
    sideways so its profile reads from both seats; a soft contact shadow
    (`groundBlobs`) kept on the board as a piece rises; a bevelled rounded
    frame with grain, the top a varnished `ShapeGeometry`. Motion:
    `animateMove` (lift, arc, settle), `puff` (dust, sparkles: `Points`
    cleaned up through `fx` on a new game), `pulse` (check), `topple` (mate:
    it falls where there is room). The camera: `view` (`az`, `dEl`, `zoom`,
    `top`, a `focus` ease), clamped in `clampView`, fitted by `aimCamera`;
    `camera('orbit' | 'zoom' | 'top' | 'reset')`, driven by two fingers, the
    right or middle mouse button and the wheel in `chWireInput`, and the
    «⬇ من فوق» / «↺» buttons (`chViewCam`).
  - **Input**: `chWireInput` (a tap, or past 10px a drag that lifts the piece
    and follows the finger; `touch-action: none` only while it's your move),
    `chTapLogic` / `chDropLogic` (shared by one phone and the room), the
    promotion picker over the square (`chAskPromotion`, kept inside the board).
  - **One phone** (`appState.shatranj`, restored through `soloRegister`): two
    on one phone or against the computer, the clock (read from its stamps,
    never counted down; it stands still while the board is off screen), the
    tally, the computer thinking after the last move has landed and at least a
    human moment, capped by its clock. **The live coach** reads one analysis
    of your position on your turn (`chCoachPrepare`); your move is shown, then
    judged (`chCoachJudge`): a blunder opens `#ch-warn-modal` (take it back:
    the position, the clock and what was taken are put back exactly), anything
    else goes on with the word on the move under the board.
  - **Batch 2 on one phone** (24 Sep 2026):
    - **Help and the rating**: `s.helpLimit` (`CH_HELP_LIMITS`, the game keeps
      the limit it started with in `s.gameHelp`), `s.help` (`chHelpNew`: undo
      and hint counted, `best` / `warn` / `setup` / `odds` as flags; the kept
      record carries it), `chHelpLeft`, `chUndoLocal` (rebuilds from `s.start`
      and `s.hist` through `chRebuildLocal`, so the repetition keys are right,
      and the undo count is in the animation key - else the piece snaps).
      `s.rating` `{ r, n }`, `chRatingDelta`, `chUnratedReason` (the setup's
      line), `s.rated` settled at the start, `chConfirmReplace` /
      `chAbandonLocal` (a rated game left counts as a loss); the record keeps
      `rated` and `rating`; أرقامي shows it.
    - **The characters**: `CH_CHARACTERS` (id, elo, style), `chCharFaceSvg`
      (drawn 64 × 64 faces, no ids), `chCharSuggest`; `s.char` ('custom' is
      the slider), `s.opp` (the rating and style this game is played at).
    - **Opening names**: `JS_ChessOpenings.html` (`chOpeningMatch`: the
      deepest known position so far, and where theory ended); the content
      check plays every line.
    - **The position editor**: `JS_ChessPosition.html` (view `pos-shatranj`,
      `chPosOpen`, `CH_ENDGAMES`, `chPosProblem` - one king each, no pawn on
      the first or last row, the side not to move not in check, a position
      already over), played through `chNewGame({ fen, setup, eg })`.
    - **960, the handicap, the clocks**: `s.variant`, `s.odds`, `s.oddsBy`
      (you / the computer), `s.oddsColor` (two on one phone); a new game's
      `s.gameVariant` and `s.gameOdds` `{ kind, giver }` (`chOddsNow`,
      `chOddsGiver`, `chOddsFen`), the tags over the board
      (`chLocalTagHtml`); the clock buttons are built from `CHESS_CLOCK_IDS`.
      On every board: a king picked up in 960 shows a ring round the rook it
      can castle with (`chTargets`, `chIs960`), and a tap or a drop on it
      castles (`chCastleByRook`); both boards find the castling rook for their
      animation with `chCastleRookSquares` (the king can land on the rook's
      square).
    - **Premoves** (`chPremoveTargets`, `chPreTapLogic`, `chPreDropLogic` -
      a drop that queues returns `'pre'` and the piece goes home quietly -,
      `chPremoveLegal`, `chPremoveDropped` and the boards' `nudge(sq)`):
      `chLocal.pre` played in `chAfterMove` when your turn comes;
      `chRoomLocal.pre` (keyed on the deal and round) played at the top of
      `chRoomRender` through `chRoomPlay`. Both `preOn`s also ask
      `chLook().premove` (the switch).
    - **Looking back** (`chBrowse`, JS_Chess.html): `chReplayPositions(start,
      hist, lostStart)` plays the game's own record again with `chessPlay`
      (960's X-FEN start and the hidden queen's '*' moves work as in the
      review) and keeps every position, extended as moves come
      (`chReplayMemo`); `chBrowseSync(key, total, paint)` per paint (a new game
      key goes live, a longer record while looking pulses), `chBrowseGo` /
      `chBrowseStep` / `chBrowseMove`, `chBrowseModel` (that position, `anim:
      null` - no motion or sound -, no marks, `input.canMove` false and a tap
      going live), `chBrowseNavHtml` in the layout's `[data-ch-browse]` (under
      the board upright, at the top of the side column when wide),
      `chBrowseNoteHtml` in the status's place, `chBrowseScrollList`, and a
      keydown listener on `play-shatranj` and `room-chess`. Going live paints
      with `still`, so the last move isn't played again. The room keys it on
      the deal, round and tournament match and replays `bd.start` /
      `bd.hist`; the TV never calls it.
    - **Arrows by hand**: `chView.anno` (keyed on the model's key and its
      animation key, so a move clears it), `chView.pen` (✏️), `chView.draft`
      (the arrow being drawn); `chAnnoMerge` puts them over the model the
      screen gave (never into it), `chAnnoToggle`, `chAnnoClear` (🧹); marks
      of kind `'user'` (`.ch2-sq.is-anno`, `--ch2-anno`; a solid ring in 3D).
    - **Best moves**: `chBestPrepare` (a candidate a tick, `CH_BEST`),
      `chBestNow`, `CH_BEST_COLORS`; an arrow's `label` / `ink` are drawn at
      its head on both boards (the 3D overlay turns the text for Black).
    - **Sharing** (`JS_ChessReview.html`): `chShareRowHtml(key)` at the end of
      a game, in the review and on a room's phones once over; `chShareGame`
      ('pic' | 'pgn' | 'video'), `chShareCardData`, `chDrawBoardCanvas` /
      `chDrawBoardFrame` (the 2D board on a canvas in the phone's style, the
      pieces from `chPieceImages` - the page's symbols with their colours
      written in), `chPgn` (Event, Site, Date, Round, White, Black, Result,
      Variant, SetUp / FEN, Termination), `chShareVideo` (`chVideoMime`,
      `chVideoFrames`, MediaRecorder on a canvas painted every 100 ms).
- **`JS_ChessReview.html`** - the kept games (`ashryChessGames_v1` in
  localStorage, the last 20, each with its review once worked out, so it
  reopens at once) and the review screen: the players and their accuracy
  (counting up), the result, a progress bar while it works (a slice of ~60ms a
  tick), ⏮ ◀ ▶ ⏭ and the arrow keys, the move's verdict and why, "show the
  better move" (the position before, the move played in orange and the better
  one in green), "try the better move", the key moments, the graph (tap to
  jump), each side's counts, the move list with its verdicts. A room's game is
  kept on each phone that played it, and anyone in the room can open its review
  from the result card; leaving the review goes back to the room.
- **`JS_RoomChess.html`** - the room and the TV: your colour at the bottom;
  your move drawn as your finger lifts (`chRoomLocal.early`, the same
  animation key as the server's board, so nothing moves twice; refused, the
  room's board comes back); the clock read through the smallest gap seen
  between a clock start and hearing of it; the draw offer's card; the host's
  clock in the lobby, remembered. `roomTurnOf` answers for your move or a draw
  offered to you.
- **Layout** (section 30 of `Style_Chess.html`): upright the pills (each with its
  clock and what it took, wrapping), the status, the board, what to do, the
  coach's word, the moves; on a phone on its side and from 900px the board
  takes the height beside a column; the TV is the board with the pills, the
  status, the moves and the line beside it.

- **الوزير المستخبي (the hidden queen)**: the owner's rules are under
  *The owner's specs*. The game object `g` never holds the secret: a hidden
  queen is a pawn in it, so everything that reads `g` (the other side's moves,
  check, the boards, the review, the TV) sees a pawn. The secret is one small
  object per game (`chessHqNew`: `{ sq, pick, how, at }` per colour) kept where
  secrets live: the server's `room._chq` (never projected) with each seated
  phone's own square in `room.secrets[pid].hq`, and the one-phone game's
  `appState.shatranj.hq`. In `Chess.js`: `chessHqEngine` / `chessHqMoves` (the
  queen moves from the pawn's square a pawn couldn't make, legal, never onto a
  king - the pawn made a queen for the look and put back), `chessHqPlay` (a
  move with the secret: a reveal turns the pawn into a queen and plays the
  queen move through `chessPlay`; a pawn move carries the secret; a promotion
  ends it; a hidden pawn taken reports `captured` and counts `'q'`; the end
  judged with the next side's hidden queen), `chessHqReplay`, and the marker:
  a revealing move is stored `e2e5*`, `chessFromUci` reads `hq: true`, and
  `chessPlay({ hq: true })` makes the pawn a queen first - so every replay of a
  stored game (the review, the PGN, the share card, the mistakes' puzzles)
  works with nothing else knowing the variant. `chessBestMove(g, { hq })` adds
  its own hidden queen's moves at the root (`CHESS_HQ_BIT` on the engine
  number, the pawn swapped for a queen and the hash with it around each). In
  `RoomChess.js`: `chessRoomOptions` takes `'hq'`, `chessRoomDeal` starts
  `shared.chess.hq = { picking, picked, pickEnds, events, end }` (winner stays
  only, the usual start, no handicap) and resets the room's slices, `hqPick`
  (`round` against a stale tap), the pick clock in `chessDeadline` /
  `chessTimeout` (`CHESS_HQ_PICK_SECS`), `chessHqAutoPick` (the clock and the
  host), `chessBoardMove(..., hq)`, `chessHqAfterMove` (the reveal or capture
  the table saw, `bd.last.hq`, and the secrets moved), `chessHqEnd` (both
  picks, at every way a game ends). On the page: `chMovesFor` / `chTargets(g,
  sel, hq)` add your hidden queen's moves to a tap and a drop; the mark
  `kind: 'hq'` is the crown (2D: `.ch2-sq.is-hq` and `.ch2-hq`; 3D: a gold
  ring); `chHqMoment` the words over the board (`motionFirst`), the room's
  keyed on the deal with a baseline so a reload or a late join replays nothing
  (`chRoomHqMoments`); `chAnimOf` draws a reveal as a promotion to a queen;
  `chHqEndHtml` both picks at the end. The one-phone game: `chHqChosen`,
  `chHqOf`, `chHqPicking`, `chHqPickLocal`, and `chRebuildLocal` replays the
  secret for an undo. Tests: `rules.mjs` ("Hidden queen, 24 Sep 2026"),
  `leaks.mjs` (`VARIANT_DRIVERS['chess:hq']`, `PROBES['chess:hq']`, proved on
  a scratch build that put the squares in `shared` and gave each phone the
  other's), `play-all.mjs` (`hiddenQueenRobots`, `--only=hq`).

**The coach's take back is counted** (the audit of 1 Oct 2026): `s.tb` goes up on every
take back and is part of the move's animation key and the hidden queen's moment
(`chTakeBackKey`), so the move played instead slides and sounds; `chCoachPrepare` looks at
a position once even when Continue or a new game call it twice.

**The review of 1 Oct 2026.** The computer's move on one phone is searched in a Web Worker (`chEngineThink`, `chEngineWorker` in `JS_Chess.html`): the worker is built from `Chess.js` cut out of the page's own code between `chessSrcBegin()` and `chessSrcEnd()` (an inline script on the one page, the chess chunk's file under chunks, fetched through the offline cache), so the ratings and results are the same and the page no longer stands still for up to 1.5 s. No Worker, no source or a worker error falls back to `chessBestMove` on the page. `chStopTimers` moves `chEngine.seq` on, so an answer arriving after leaving the board or starting a new game is dropped, and one for a position that moved on asks again. In rooms, a game first seen already over (a reload, a late joiner, a TV coming on) doesn't cheer again (`chRoomFirstSight`, through `duelRoomFirstSight`). الوزير المستخبي: the host's «pick for» naming their own seat is refused on the server.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.

**On a phone on its side (3 Oct 2026, the owner's look 10C):** 2D/3D, ⚙ and ✏️ stand in a column beside the board, شطرنج's names column is 10rem, and تلميح / تراجع / استسلام (the puzzles' 💡 / 👀) are icons in one row - `.ch-btn-label` hidden, `chIconLabel` keeping the words as aria-label and title. The board is 291px on 667x375 (245 before). Section 67 of `Style_Talk.html`.
