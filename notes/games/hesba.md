# حسبة — Numbers

Six numbers and a target (four on سهل): merge two tiles with + − × ÷ into a new tile until one is the
target, exactly. Rooms + TV, a daily in تحدي اليوم, and alone, unlimited, with a best score. Built
9 Oct 2026 from the owner's rules (notes/ideas.md, *New games of 9 Oct 2026*, 1431) in look أ «اللوح»
of the sheet https://claude.ai/artifact/LtDnAyWLkZExt5yxDBpxMH (its mock: notes/archive/sheets/hesba-looks.js.txt, look 'A').

## The owner's spec

- Levels in the setup: **سهل** 4 numbers, target under 100; **صعب** 6 numbers (small 1-10 and some of
  25/50/75/100), target 101-999.
- Every number used at most once, whole steps only; every deal is checked to be reachable exactly
  before it is used.
- The answer is built by tapping tiles (number, operation, number merge into a new tile; ↶ steps
  back), no typing.
- Rooms: the same deal on every phone, the TV shows the target and the clock; **the first exact answer
  wins the round**; if nobody is exact when the clock ends, the closest wins (a tie shares), then one
  exact way is shown. 60 s, 5 rounds (host: 30/60/90 s, 3/5/7 rounds).
- Also a daily puzzle in تحدي اليوم and solo unlimited with a best score. Not one-phone pass-and-play.

### Decided while building (the rules didn't say)

- **Numbers**: سهل deals four of 1-10 (no number three times), with a 25 or a 50 one time in three;
  صعب deals 1-4 of the big four (no repeats) and small ones, at most two of any (as the TV show's
  cards). A target is never a dealt number nor one step away (that is no puzzle).
- **Subtraction and division go the way that works**: 3 − 8 is taken as 8 − 3 (and 4 ÷ 12 as 12 ÷ 4);
  a step with no whole answer either way (7 ÷ 2, 5 − 5) shakes the tile with «الخطوة دي مش بتطلع رقم
  صحيح». The second tile flies into the first; the new tile takes the first one's place.
- **«أقرب»** is the closest number made or dealt so far (any of them, even one merged away since:
  it was reached); «ابعت N» / «خلاص على N» use it.
- **Rooms**: a phone may send again and again; the server keeps its closest (an equal one later
  doesn't replace it). A tile hitting the target is sent at once. At the phone's 0:00 its closest is
  sent by itself if it beats what it sent (the server takes answers 1.5 s past the clock for this).
  A tie at the clock shares the round (each tied player +1). Nobody sent: nobody takes it. The round
  that ends exact shows **the winner's own way** («طريقة منى»); otherwise one the solver found
  («طريقة بالظبط»). The host (or anyone once the host is away 20 s) has «خلّص الجولة» mid-round and
  «الجولة الجاية» after; the last round goes straight to the end (podium, the last way, the board).
  The level is the host's too (lobby: level, round time, rounds; remembered on the host's phone).
- **The board** is rounds won; exact answers, then the smallest total distance, break a tie.
- **Alone («لوحدك»)**: puzzle after puzzle, a minute each (90 s on صعب). Exact scores 10 + 1 for every
  10 s left; 5 off or less 7, 10 off or less 5 (the TV show's scores), more 0. Any puzzle not exact
  costs one of three hearts; the run ends with the hearts. Best = the run's score, per level.
- **The daily**: one صعب puzzle from the date, no clock against you; its result is the time it took
  (exact) or how far off it was settled («خلاص على N» ends it). Share: `➗ حسبة ✅ 1:23` or `🎯 فرق 3`.
  The archive plays a past day the same way and records nothing. In تحدي اليوم since 2026-10-09.
- **Icon**: drawn (`ICON_ART.hesba`: 2 × 4 under an amber 8). 🧮 is the universal score keeper's, so
  the game's emoji in plain text (share, the TV pill, the stats list) is ➗.

## How it is built

- `Hesba.js` - shared by the page (the chunk, `SHARED_LISTS`) and the server (`FILES`): `hesbaDeal(level,
  rnd)` builds a target from a random chain of whole steps over the numbers (so it is always reachable),
  wishing for a target evenly over the range and taking the chain's nearest, then `hesbaSolve` (iterative
  deepening with a memo of boards; a few ms for six numbers) finds the shortest exact way - the "one
  exact way". `hesbaReplay(nums, steps)` is the judge: steps by place in the pool ([i, op, j]; places
  0..n-1 the numbers, then each result), each place once, every step whole. `hesbaRng` (mulberry32)
  seeds a deal: the daily from `soloDaySeed('hesba')`, a room from a random seed. `hesbaPoints`.
- `RoomHesba.js` - `ROOM_RULES.hesba`: `start {level, secs, rounds}`, `send {round, steps, pick}` (the
  server replays the steps, takes `pool[pick]`, never a phone's value), `nextRound {round}`,
  `finish {round}`, `playAgain`. Hidden until the round closes: the way (`room._hesba.way`) and every
  phone's steps (`room.secrets[pid]`); public: who sent which number, how far. `shared.result` =
  { winners, off, exact, way, wayOf, at }; `shared.board` rounds won.
- `JS_HesbaLook.html` - the look and the board shared by every way of playing: the board model
  (`hxBoardNew`, `hxTap`, `hxOp`, `hxUndo`, `hxReset`, `hxBest`), its pieces (target card, tiles,
  operations, the trail of step chips, the ladder of the way), the motion (`hxMergeFx`: a copy of the
  second tile flies into the first, the new tile pops; `hxHitFx`: the tile lifts into the target, which
  turns green; the ladder's rungs slide together and pop, once per round through `motionFirst`), and the
  styles: one `<style>` added at the end of `<body>` the first time the game draws (`hxStyle`), so they
  come with the chunk and touch no shared stylesheet (classes `hx-`, `hxa-`, `hxtv-`). Sideways and from
  900 px wide the play screen is two columns (target, steps, strip | tiles, operations, buttons).
- `JS_Hesba.html` - alone and the daily (`soloRegister('hesba')`, timed: the clock stops while the board
  is away; a reload comes back to the board, a hit just before it settles). `appState.hesba`.
- `JS_RoomHesba.html` - `ROOM_GAMES.hesba` (the phone's board in `appState.hesbaRoom`, keyed on the
  room, deal and round, so a reload keeps it; only the steps the closest number needs are sent,
  renumbered) and `TV_GAMES.hesba` (the target, the numbers, the clock, everyone's number as it
  comes; the result with the way and the board; the end with the podium). Its clocks stop through
  `onRoomClocksReset`.
- Lists it is in: `GAME_LIST` (`art:hesba`, room min 1, crew `brain`, added 2026-10-09), `DAILY_GAMES`
  and `STATS_SOLO_GAMES` (JS_Daily.html), `HELP_ENTRIES`, `SHELL_USES_OK` (`startHesba`, the daily's door).
- Checks: `tools/validate-content.js` deals 400 of each level and replays each way through the
  server's judge; `rooms-worker/test/leaks.mjs` (the way and the steps hidden while playing);
  `play-all.mjs` segment `hesba` (refused steps, the exact win, the closest on the clock, nobody, play
  again).
