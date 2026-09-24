# Batch 2 runbook - chess on one phone, and what it brings to rooms

The owner approved every item on 24 Sep 2026 (the choices are recorded under
*Decisions already made*). The chess code is described in GEMINI.md
(see GEMINI.md). The anchors below are where each feature hooks in; grep them.

## The executor's contract

(the same as batch 1: branch `batch2`, one commit per task `T2.x: …`, never
push or deploy, one global scope for page files, translations in both
languages, no Tailwind classes, tokens only in `Style.html`, parse-check every
file, run `cd tools && npm run check` and `cd rooms-worker && npm run test:rules`
before the report; rules tests go in `rooms-worker/test/rules.mjs`, your own
tests outside the repo.)

Extra, for chess:
- `Chess.js` is shared by the page AND the rooms server. Anything added there
  must be pure (no DOM, no storage) and prefixed `chess` / `CHESS_`. Page-only
  data (opening names, character texts, themes) goes in page files, NOT in
  `Chess.js`, so the server bundle doesn't grow.
- Every existing perft number in `rules.mjs` must still pass unchanged:
  standard chess must behave bit for bit as before.
- Keep the analysis deterministic: bounded by nodes, as today.

## Decisions already made (the owner, 24 Sep 2026)

1. **Opening names**, shown as you play and in the review ("where you left
   known theory").
2. **Your rating**: starts at 800, a normal Elo (K 32 for the first 20 rated
   games, then 20) against the computer's rating. **Only games with no help
   count**: no undo, no hint, no best-move arrows, no coach warning/take-back,
   not from a set-up position, no handicap. Chess960 counts. The setup screen
   says before the game whether it will be rated. Starting a new game over an
   unfinished rated one asks first and counts it as a loss (chess.com's rule).
3. **Computer characters** beside the slider (the slider stays as «مخصص»).
4. **Undo and hints against the computer**: unlimited / 3 per game / none,
   default **3**, remembered. Undo takes back your move and the computer's.
   The hint no longer needs the coach switched on. Each is counted separately.
5. **Set up a position / famous endgames**: an editor and a list of endgames,
   played against the computer (or two on one phone).
6. **Chess960, handicap and the new clocks are everywhere**: against the
   computer, two on one phone, room duels and the tournament (host's lobby
   choice) - except handicap, which is NOT offered in the tournament (a
   knockout between people drawn at random has no "stronger player"; told to
   the owner). **Premoves**: only on your own phone in a room and against the
   computer.
7. **Drawing arrows and marking squares** on the board.
8. **Board styles**.
9. **Sharing a game**: a picture of the final position, PGN, and a short
   replay video where the phone can record one.
10. **Best-move arrows**: a coach switch «أفضل الحركات», off by default,
    against the computer only: on your turn the top 3 moves as arrows (green,
    then lighter green, then yellow), each labelled with the win chance
    «فوزك 64%». Using it makes the game unrated.

Choices made by Claude (the owner may change them; each one place in the code):
- Characters (name, rating, style, one line):
  «نونو» 400 (just learning, random-ish), «عم حسن» 800 attack (loves checks
  and going for the king), «ميرا» 1100 solid (trades, keeps her king safe),
  «الكابتن» 1400 balanced, «الأستاذ» 1700 precise, «الجنرال» 2000 (the
  strongest). English: Nono, Uncle Hassan, Mira, The Captain, The Professor,
  The General. A drawn face each (SVG, small, in the game's style - like خمّن
  مين's faces), no photos.
- Board styles: خشب (today's, default), رخام (white/grey marble, pieces ivory
  and black), بطولة (green and cream squares like a tournament board, pieces
  boxwood/ebony), ليلي (deep blue and slate, pieces silver/charcoal). The flat
  board gets the same four palettes. Remembered on the phone.
- Handicap choices: none, a pawn (f-pawn), a knight (b-knight), a rook
  (a-rook, castling that side lost), the queen; and time odds: the giver has
  half the clock. Against the computer: who gives it (you or the computer);
  two on one phone: White or Black; in a room: **the champion** gives it
  (winner stays; with exactly two in the room, the one who won the last game;
  first game none).
- New clocks: 1+0, 3+0, 15+10 added to off, 3+2, 5+0, 10+0.
- Premove: one queued move, shown as a blue arrow; played the instant it is
  your turn if still legal, dropped otherwise; a tap anywhere else cancels.
- Arrows: a ✏️ button toggles drawing mode (touch); on a computer a right-click
  drag draws an arrow and a right-click marks a square. Colours: green; a
  second tap on the same arrow removes it. Cleared when a move is played.
- Sharing: a card with the final position drawn (a flat board in the share
  card, names, result, accuracy if reviewed); «انسخ PGN» / "Copy PGN" (share
  sheet with text where available); «فيديو» where `MediaRecorder` on a canvas
  is supported: the flat board replayed at 0.6 s a move, ≤ 20 s (skipped
  moves compressed), else the button is hidden.

## Phase 2A - the engine (Chess.js, tests)

### T2A.1 - Chess960 in the rules
- `Chess.js`: carry the castling rooks' files on the game (`g.rooks` or
  similar, `[wK, wQ, bK, bQ]` files; standard = h/a), through `chessFromFen`,
  `chessPos`, `chessCloneGame`, `chessFen` (X-FEN: KQkq when the rook is the
  outermost on that side, else the file letter), `chessKey`.
  `CHESS_CASTLE_KEEP` becomes per-position (a mask per rook square).
  `chessGenCastle`, `chessDo`, `chessUndo`: the 960 rule (king and rook land on
  g/f or c/d; every square between the king and its destination, and the rook
  and its destination, empty except for those two; the king's path not
  attacked). A castling move is represented as king from → the king's
  destination square, as today, EXCEPT when that square is the king's own or
  the other castling move's destination is ambiguous: then accept also "king
  takes own rook" (`to` = the rook's square) in `chessFind` / `chessPlay`.
  SAN stays O-O / O-O-O.
- `chess960Start(n)` (0-959, Scharnagl numbering) → FEN; `chess960Random(rnd)`.
- Tests in `rules.mjs` (in the style of the existing perft block): standard
  perft unchanged; the published Chess960 perft positions (at least 6, depth 3-4,
  from the chessprogramming wiki "Chess960 Perft Results"); position 518 equals
  the standard start; a castling where the king doesn't move; castling through
  an attacked square refused; the FEN round trip.

### T2A.2 - Multi-line analysis and a style for the computer
- `chessAnalyse(g, { nodes, lines })`: with `lines: n > 1`, return `lines`:
  the top n root moves with their scores (full window at the root for those),
  still bounded by nodes; `lines: 1` or none returns exactly what it returns
  today.
- `chessBestMove(g, { elo, style })`: `style` 'attack' | 'solid' | undefined.
  Attack: a root bonus for checks and for moves that attack squares next to the
  enemy king; solid: a root bonus for trades when not behind and for keeping
  pawns in front of the king, a penalty for early queen moves. Only at the
  root (never in `chessEvaluate`, so analysis and the review are unchanged).
- Tests: `lines: 3` gives 3 distinct legal moves, sorted, the first equal to
  `lines: 1`'s move; a mate in one's best line is the mate; same input same
  output twice; styles still always legal over 50 random positions; the attack
  style plays a check more often than none over a set of positions.

### T2A.3 - The clocks, handicap and start positions (shared)
- `CHESS_CLOCK_IDS` / `CHESS_CLOCK_SPEC` gain `1+0`, `3+0`, `15+10`
  (update the test that asserts the list, and the help text lines in
  `JS_Core.html` both languages).
- `chessHandicapFen(kind, side)` kind 'pawn' | 'knight' | 'rook' | 'queen'
  → the start FEN without that piece (castling right removed with its rook).
- `chessClockNew(id, { odds: 'w' | 'b' })`: the side giving odds starts with
  half the base.
- Tests for each.

## Phase 2B - rooms and the tournament

### T2B.1 - Room options
- `chessRoomOptions`: `{ clock, variant: 'standard'|'960', odds: 'none'|
  'pawn'|'knight'|'rook'|'queen'|'time' }`. `chessBoardNew` takes a start FEN
  and keeps `bd.start`; the clock takes the odds. 960: a new random start each
  game (`nextPrompts` not needed; `Math.random` on the server is fine) - in a
  tournament one position per match kept on the match (`m.start960`), used by
  its replay and Armageddon. Handicap: the champion gives it (see decisions);
  the tournament ignores `odds`.
- `JS_RoomChess.html`: the lobby gets rows for the variant and (winner stays
  only) the handicap, remembered with `recallOptions('chessRoom')`;
  `startPayload` sends them; the kept-game record uses `bd.start` (fixes the
  review of a 960 room game); the board/status shows «960» / «حسبة: بدون وزير».
- Rules tests: a room 960 game starts from a legal 960 position and its castle
  works; odds remove the piece from the champion's side only; the tournament
  keeps one 960 position through a replay; an old phone sending only `clock`
  gets standard, no odds.
- The leak check (`rooms-worker/test/leaks.mjs`) still passes.

## Phase 2C - one phone

### T2C.1 - Opening names
- A page file `JS_ChessOpenings.html` (include it in `Controller.html` next to
  the other chess files): about 150 openings as `{ ar, en, moves: 'e4 e5 Nf3
  Nc6 Bc4' }` (SAN, standard names and the Arabic names chess players use:
  الافتتاح الإيطالي، الافتتاح الإسباني (روي لوبيز)، دفاع صقلية (ونجدورف، التنين…)،
  الدفاع الفرنسي، دفاع كارو-كان، جامبيت الوزير (مقبول/مرفوض)، الدفاع الهندي
  الملكي، الدفاع الهندي النمزوفيتشي، الافتتاح الإنجليزي، دفاع بيرك، الدفاع
  الإسكندنافي، جامبيت الملك، جامبيت إيفانز، الدفاع الهولندي، نظام لندن…).
  Match by position (the placement part of the FEN after each ply, built once
  at load by playing each line with `chessPlay`), so transpositions work; the
  name shown is the deepest match so far and stays after theory ends.
- Shown: a small line over the move list (one phone, room, TV); in the review
  «خرجت من النظرية في الحركة 7» at the first move after the last match.
- Not in a 960 or set-up game.
- A content check in `tools/validate-content.js`: every line is legal from the
  start, no two entries with the same final position, both names present.

### T2C.2 - Undo and hint limits; help tracking
- Setup: «التراجع والتلميح» segmented: بلا حدود / 3 / ممنوع (default 3),
  remembered in `appState.shatranj`.
- Play vs computer: a ↶ button (your move and the computer's; after a finished
  game no), a 💡 hint (independent of the coach; the coach's hint option
  becomes this button), each showing what is left («↶ 2»). Undo rebuilds from
  `s.start` + `s.hist` (repetition keys right), clears the computer's pending
  move, and adds an undo counter to the animation key (the map's trap).
- `s.help` records what was used (undo, hint, best, warn, setup, odds); the
  kept record carries it.

### T2C.3 - Your rating
- `appState.shatranj.rating` `{ r: 800, n: 0 }` (or its own key, saved like
  the rest). After a finished rated game vs the computer: expected score by
  the usual formula against the computer's rating (the character's or the
  slider's), K 32 for n < 20 then 20; draws 0.5.
- Setup shows «تقييمك 812» and under Start «الماتش ده محسوب في تقييمك» or
  «مش محسوب: التلميح/التراجع مفتوح» (the reason). A suggestion under the
  characters: the one nearest your rating + 100.
- Starting a new game (or leaving to the setup and pressing Start) over an
  unfinished rated game: a confirm «الماتش اللي فات هيتحسب خسارة», then it is
  counted as a loss. Resigning counts as a loss.
- The kept record carries `rated` and the rating change; the review shows it.
- The stats screen (أرقامي, `STATS_SOLO_GAMES` / the stats code) shows the
  rating if that screen lists games - find it; skip if it would need a new
  layout.

### T2C.4 - Characters
- Setup: a row of the six characters (face, name, rating) plus «مخصص» which
  shows the slider; remembered. The opponent's pill shows the character's
  name and face instead of «الكمبيوتر 1200». The computer plays with
  `chessBestMove(g, { elo, style })`. Their one line shows under the row when
  picked. Faces: `chCharFaceSvg(id)`, drawn SVG, 6 distinct looks.

### T2C.5 - Set up a position and famous endgames
- A «🧩 وضع مخصوص» button on the setup opens an editor (a flat board, a
  palette of the 12 pieces and an eraser, whose turn, castling rights where
  valid, «مسح» / «الوضع الأصلي»), and a list of endgames (ملك ووزير ضد ملك،
  ملك وطابية ضد ملك، ملك وعسكري ضد ملك، فيلين، فيل وحصان، طابية وعسكري ضد
  طابية (لوسينا)، وضع فيليدور، سباق عساكر - each with a FEN and a line of what
  to do). Validation before playing: exactly one king each, no pawns on the
  first or last row, the side not to move not in check; errors said in words.
  Castling rights only where king and rook stand on their squares.
- Plays through `chNewGame({ fen })`; unrated; "who plays which side" from the
  setup's colour.

### T2C.6 - Chess960, handicap and the clocks on one phone
- Setup: «نوع اللعبة» عادي / 960; «حسبة» (handicap) none + the four pieces +
  time, and who gives it (vs computer: أنا / الكمبيوتر; two on one phone:
  أبيض / أسود); the clock buttons gain 1+0, 3+0, 15+10 (build them from
  `CHESS_CLOCK_IDS` instead of hard-coding). 960 draws a new start each game
  (and "play again" draws again); the kept record has the start FEN.
- Castling in 960 on the board: tapping the king then either the destination
  square or its own rook plays it.

### T2C.7 - Premoves
- Against the computer and in a room on your own phone: while it is the other
  side's move, you may pick up your piece and choose a target among its
  pseudo-legal moves (ignoring whose move it is and checks; a simple generator
  for the waiting side is fine); it shows as a blue arrow and the piece stays;
  when your turn comes it is played if legal (through the normal move path, so
  the room's stale-tap guard sees the right `move` count), else dropped with a
  small shake. One premove at a time; tapping elsewhere cancels. Not when
  two share one phone.

### T2C.8 - Drawing arrows and marks
- As decided above, on the 3D and flat boards (overlay: `drawOverlay`
  `arrows` / `marks`, and the flat board's SVG), on one phone, in a room
  (your own screen only, never sent), and in the review.

### T2C.9 - Board styles (MOVED to Phase 2D, T2D.1 - skip it here)
- Settings of the chess setup: «شكل الرقعة» with the four styles, a small
  swatch each; applied to the 3D board (materials and the board canvas colours;
  rebuild or recolour) and the flat board (CSS custom properties per style on
  the board element). Remembered.

### T2C.10 - Sharing
- On the result card and in the review: «شارك» → the picture (extend
  `shareResultCard` with an optional `board` (64 codes + last move) drawn as a
  flat board on the card - keep old callers working), «PGN» (tags Event
  "Ashry", Date, White, Black, Result, and SetUp/FEN when `start`, Variant
  "Chess960" when 960; moves in English SAN from the record) and «فيديو»
  (MediaRecorder on an offscreen canvas; mp4 or webm, whichever
  `MediaRecorder.isTypeSupported` says; hidden where unsupported).

### T2C.11 - Best-move arrows
- A coach switch «أفضل الحركات» (off by default) against the computer: on
  your turn `chessAnalyse(g, { lines: 3, nodes })` (keep the main thread
  responsive: split into a timer slice like the review does, and show
  nothing until ready); three arrows (green, light green, yellow) with a
  small label at each arrow's head: «64%» (the win chance for you, by
  `chessWinPct`), and a legend line «فوزك لو لعبت: ♞f3 64% · e4 61% · d4
  58%». Drawn on the overlay canvas (3D) and SVG (flat). Makes the game unrated
  (the setup says so).


## Phase 2D - the 2D board, and the 3D board polished (the owner, 24 Sep 2026)

Decisions (the owner): a real **2D board like chess.com** is a choice beside the
3D one, **2D by default on a phone**, a button on every chess screen switches
(«▦ 2D» / «🧊 3D»), remembered on the phone (`appState.shatranj.view` or its own
key); **the TV keeps 3D**. The 3D board gets better animations, a finer look and
camera controls. T2C.9 (board styles) is done here, for both boards.

### T2D.1 - The 2D board
- Replace the fallback flat board (`chMakeFlat`, `chFlatBoardHtml`, the flat
  styles in `Style.html`) with a proper 2D board used everywhere a board is drawn:
  one phone, the room's phones, watchers, the review, the puzzles (batch 3 reuses
  it), the tournament's mini boards (keep those small and static). It stays the
  fallback where WebGL can't draw.
- Look: squares as a CSS grid; the default style green `#769656`-ish and cream
  `#eeeed2`-ish (define as tokens `--ch2-dark` / `--ch2-light` per style, not
  literals in rules); coordinates small in the corner of the edge squares (files on
  the bottom row, ranks on the left column, in the other square's colour); the last
  move's two squares tinted yellow (`--ch2-last`); the picked piece's square tinted;
  legal moves as a soft dark dot, a capture as a ring round the square; check as a
  red radial glow under the king; arrows and marks (T2C.8) drawn in an SVG layer.
- Pieces: a new set of drawn SVG pieces in the clean modern style players know from
  chess.com / Lichess (flat colour, a dark outline, subtle shading; white pieces
  ivory with a dark outline, black pieces near-black with a light inner line), our
  own drawings (do NOT copy any existing set's paths), as `<symbol>`s defined once
  in the page and used with `<use>`; readable at 34 px.
- Motion: a move slides the piece in 150 ms (Web Animations, transform only, from
  the old square to the new, `chMotion` / `motionOff()` respected); a capture fades
  the taken piece under the arriving one; castling slides king and rook together;
  a promotion pops the new piece; a drag follows the finger with the piece lifted
  (scale 1.1, a shadow) and snaps back when refused; an illegal drop shakes.
- Sounds (made with the app's `fxTone` / `fxNoise`, no files): a wooden tock for a
  move, a sharper knock for a capture, a double tock for castling, a ping for
  check, a low chord for the end.
- Board styles (T2C.9 moved here): «أخضر» (default), «خشب», «أزرق», «رخام»; each a
  pair of square colours + last-move tint for 2D, and board/piece materials for
  3D; picked in the chess setup (and a small ⚙ on the board screen), remembered.

### T2D.2 - The view switch
- A small button on every chess board screen (one phone, room phone, review,
  puzzles): «🧊 3D» when in 2D and «▦ 2D» when in 3D; switching keeps the game,
  the selection, the arrows. Default 2D on a phone (first visit), 3D on the TV
  (the TV has no switch). On a device without WebGL the button is hidden and 2D is
  used. Remembered on the phone; a 3D load failure falls back to 2D silently.
- Three.js is not loaded at all while the phone stays in 2D (only when switching to
  3D or on the TV) - a chess game in 2D costs no 3D download.

### T2D.3 - The 3D board polished
- Animations (`chMake3D`): a moving piece lifts, travels in an arc (higher for a
  longer move; a knight hops higher) and settles with a small bounce; a capture:
  the taken piece is knocked over away from the attacker, slides/rolls a little,
  a puff of dust particles, then goes to its place beside the board; check: a red
  pulse under the king (not only a glow); checkmate: the king topples slowly
  (~1.2 s) with a thud and the camera eases toward it; castling: king and rook move
  together; promotion: the pawn sinks and the new piece rises with a sparkle.
- Look: finer Staunton pieces (smoother lathe profiles with more segments, a
  felt-green base ring, a better carved knight with a mane, ears and eyes, the
  king's cross and queen's coronet cleaner), richer wood (the board's canvas with
  real grain, a varnish sheen, a bevelled frame with inlaid coordinates), better
  reflections (environment map), softer contact shadows. Keep the draw-only-when-
  something-changes loop and pixel ratio ≤ 2; a phone must still hold 60 fps while
  moving and use no CPU at rest.
- Camera: pinch to zoom (clamped), drag with two fingers (or right/middle mouse) to
  turn around the board (clamped angles), a «⬇ من فوق» button for a top-down view
  and «↺» to reset; a small ease toward a capture square and back. One-finger
  input stays for moving pieces.

### Accept when
- A new phone opens chess in 2D; the switch goes to 3D and back mid-game with the
  position, selection and arrows kept; a reload keeps the choice.
- In 2D every move slides, a drag works, legal dots and the last move show, the four
  styles apply, coordinates read correctly for both colours (Black at the bottom
  flips them), RTL doesn't mirror the board (`dir="ltr"`).
- The 3D animations play once per move, never replay on a redraw, and the TV
  keeps 3D.
- `npm run check`, `npm run test:rules` pass; no three.js request while in 2D (check
  the page's network in your report as UNVERIFIED if you can't run a browser).

## Report
`notes/phase-reports/batch2.md` as in batch 1.

## Anchors (from a read of the code on 24 Sep 2026; grep them, lines move)

- One phone: `chState` (appState.shatranj: vs, elo, color, clock, coach, coachOpts, g, hist, sans, lost, last, clk, result, me, gameId, start, practice), `chLocal`, `chNewGame({fen, me, practice, lost})`, `chApplyMove`, `chEnd` (calls `chStoreGame`; practice games return early), `chComputerSoon` (the only `chessBestMove` caller), `chNames` (`ch_cpu`), `chCoachPrepare`, `chCoachJudge`, `chCoachWarn`, `chCoachTakeBack` (restores p.before, lost, hist, sans, clock), `chHint` (needs s.coach && coachOpts.hint), `chLocalBarHtml`, `chLocalSideHtml`, `chMovesHtml`, `chPaint` (the animation key is `gameId + '|' + s.last.n` - an undo must add a counter to it or the piece snaps), `paintShatranjSetup`, `setShatranjOption`, `chessElo`, `soloRegister('shatranj', …)`.
- Setup markup in `Controller.html`: `shatranj-vs`, `shatranj-elo-field`, `shatranj-elo`, `shatranj-elo-out`, `shatranj-color`, `shatranj-clock` (buttons hard-coded), `shatranj-coach`, `shatranj-coach-opts`, `shatranj-coach-warn|hint|comment|threats`, `shatranj-names-field`, `shatranj-history`, `shatranj-continue`; play `#shatranj-stage`; `#ch-warn-modal`.
- Boards: `chMake3D` (board canvas `drawBoard` cached on orientation; overlay `drawOverlay` cached on JSON of last/sel/targets/check/marks/arrows/orient; `arrows: [{from,to,color}]`, `marks`; piece materials built once), `chMakeFlat` / `chFlatBoardHtml` (SVG `.ch-farrows`), `chWireInput` (a drag starts only on your own piece; right-click ignored), `chTapLogic`, `chDropLogic` (use `chessLegalMoves(ctx.g)`), `chViewShow` (`.is-live` only while canMove), the rook animation in castling repeats Chess.js's `rf/rt` formula.
- Chess.js: `chessFromFen` (checks only rows and letters), `chessPos` (kings -1 when missing), `chessCloneGame`, `CHESS_CASTLE_KEEP`, `chessGenCastle`, `chessDo` / `chessUndo` (`rf = to > from ? to + 1 : to - 2`), `chessSanPos` (O-O by `to > from`), `chessMoveInfo.castle`, `chessCastleText`, `chessFen`, `chessKey`, `chessFind`, `chessBestMove` (root loop; noise per root move), `chessEvaluate`, `chessAnalyse` (one line; `pv`), `chessWinPct`, `chessEloSettings`, `chessEloBand`, `CHESS_CLOCK_IDS`, `CHESS_CLOCK_SPEC`, `chessClockId`, `chessClockNew(id)`, `chessReviewBegin` (sans, positions), `chessReviewResult`.
- Rooms: `chessBoardNew` (always `chessNew()`), `chessRoomOptions` (returns `{clock}`), `chessRoomDeal`, `TOUR_KINDS.chess` in `RoomTournament.js` (options/settingsOf call `chessRoomOptions`; deal calls `chessRoomDeal(v, {armageddon})`), `JS_RoomChess.html`: `chRoomPlay` (early move; `duelAct('move', {from,to,promo,move: bd.moves})`), `chRoomBoard`, `chRoomRender`, the lobby (`recallOptions('chessRoom')`, `duelLobbyHtml`, `startPayload` returns `{clock}`), kept-game records pass `start: ''` (must become `bd.start`). The mini board `JS_RoomTournament.html` takes any `bd.g.board`.
- Kept games: `ashryChessGames_v1` in `JS_ChessReview.html` (`{id, at, review, mode, names, elo, me, result, reason, start, moves, key}`), `chReviewPaint`.
- Tests: `rooms-worker/test/rules.mjs` chess block (`CH` API from `new Function`, `perft = (fen, d) => CH.chessPerft(CH.chessFromFen(fen), d)`, the castling tests after it, `chessClockNew('7+7') === null`).
- Share: `shareResultCard({title, icon, rows, footer, text})` in `JS_ShareCard.html` (draws name/value rows only).
- Clock help text lines in `JS_Core.html` `GAME_RULES` (both languages) list the clocks.
