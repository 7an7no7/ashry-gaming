# الجرس (the Buzzer)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**The Buzzer (الجرس)** has no content at all: the host asks their own questions
out loud and every phone is a buzzer. `buzzerAction` in `RoomGames.js` keeps
`shared.buzzes` in the order the presses reached the server, which is the one
thing a phone cannot be trusted with (replaced on 1 Oct 2026 by the order they
were pressed, held near the arrival: *Fair presses* below). The host's verdict (`correct` scores the
first in line and clears the queue; `wrong` drops them so the next in line
answers the same question, and **they are out for that question** - `s.out`,
cleared by the next question; the owner, 30 Sep 2026 - and every press carries
its question's `round`, so a late one can't lead the next question) and `lock` / `arm` (buzzers off while the question
is read) are host-only. A screen never buzzes: `buzz` from a device that is not
in `room.players` is ignored. Everything is in `shared` (`board` is the sorted
scoreboard the TV strip reads), and `TV_GAMES.buzzer` draws the first buzzer
big, the queue, the scores and the host's buttons when the screen is the host.

## The host's phone (1 Oct 2026, the before/after sheet)

«ترتيب الضغط» is a row of player chips (`roomPersonChip`, `.bz-order`): the first to
buzz lit (`.is-first`) with «بيجاوب», the rest with how far behind (`bzGapHtml`);
nobody yet is the line «محدش ضغط لسه». The host's six buttons left their card for
the bottom bar (`.bz-bar`): «✓ صح» and «✗ غلط» the main pair (success / danger, still
`correct` / `wrong { id }` of the first buzz), «🔄 سؤال جديد», «🔒 اقفل» / «🔔 افتح»
(`bz_lock_short`, `bz_arm_short`; the TV keeps the long words) and «لعبة أخرى» small
under them; «تصفير النقاط» is a small button under the standings it clears
(`.bz-reset`). The quiz's reveal / next sit under the quiz card. The players' bell
is unchanged.

## A TV host (1 Oct 2026)

A TV hosting the room has the phone host's «↺ السؤال من الأول» once a family
quiz is done and «صفّر النقاط» always (both `playAgain`), beside 🔄 and
another game.

## Take-backs (the review of 1 Oct 2026)

- «تصفير النقاط» (the phone and the TV) asks first (`bzResetScores`, `bz_reset_confirm`):
  it wipes the evening's tally.
- «↶ رجّع» for the host, under the last verdict (`bzUndoHtml`, phone and TV), sends
  `undoVerdict { seq }`. Every verdict carries `shared.last.seq` (from
  `room._bzSeq`, never reused) and the server keeps what it changed in
  `room._bzUndo`: a ✅ gives its point back and reopens the question with its line
  (round, buzzes, out, roster - a quiz's answer, once shown, stays shown); a ❌ gives
  back the point it cost and puts the player first in line again (while the buzzers
  are live). Only the last verdict, once; a new question, arm or reset clears it.

## Fair presses (the owner, 1 Oct 2026)

This replaces "the order the presses reached the server". The line is by **when each phone
was pressed**:

- The phone stamps the press on the server's clock before anything else the tap does
  (`pressBuzzer` → `buzz { round, at }`, `bzServerNow`). The clock is read from the middle
  of a timed round trip (`Room.clockMid` in `JS_Room.html`: every move's ack, the shortest
  kept, `timeRoundTrip`), which doesn't lean early by the one-way delay as `clockGap` does;
  a phone that hasn't moved in this room yet times one when the buzzer opens (`bzClock`, a
  move that changes nothing: `SILENT_ACTIONS` and `QUICK_ACTIONS` in `room.js`, no
  broadcast), and before any trip falls back on `roomServerNow()`.
- The server (`buzzerPressAt`) holds a claim between its arrival less `BZ_CLAIM_MAX_MS`
  (400 ms) and its arrival - a phone can't buy a lead it never had - and a press with no
  `at` (an older page) is its arrival. Each buzz keeps `at` (the press; the gaps «+0.18ث»
  and the TV's photo finish read it) and `arr` (its arrival).
- `buzzerInsert` puts a press ahead of every press it beat that arrived less than
  `BZ_SETTLE_MS` (150 ms) before it, and never ahead of one settled longer ago, so an order
  the host has seen doesn't change.
- On the phone, while the first in line is under 150 ms old the pressed phone shows
  «ضغطت!» / «ثانية… بنشوف مين ضغط الأول» (`bz_pressed`, `bz_settling`, `bzSettled` redraws
  when it settles), then its place; the button's label turns to «ضغطت!» on the tap itself.
  The host's ✓ / ✗ still name the first (`staleTap` on `id`), so a verdict aimed at someone
  a fairer press just passed is dropped; `undoVerdict` is unchanged.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **728 عدّل النقط بإيدك.** The host's standings (phone and TV) carry − / + on every row
  (`bzBoardHtml`, `bzAdjust`; the same rows as `renderScoreboard`, with data-pid / data-score /
  data-count for `animateScoreboards`), sending `adjust { id, delta, was }`. The server
  (`RoomBuzzer.js`, host only as before) ignores a `delta` past ±5 and, when `was` is sent, a tap
  made on a score that has since changed (a double tap counts once). Everyone else sees the plain
  board. Help rule added; the robot and a rules test.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **731 «لون الجرس»**: each phone's bell takes its player's colour - the colour of their face on the TV (`tvFaceAccent(id)`, the same person the same colour all evening) - as `data-accent` on the bell's stage (`bzColourOf`), and the press order's chips too (`bzPersonChip`). On the TV the first press of each question floods the screen with that colour for half a second (`bzTvFlood`, called from `TV_GAMES.buzzer.after` in `JS_RoomTv.html`; `.bz-flood` in `Style_Party.html`): once per question (`motionFirst` on the round), the colour of the settled first (it waits out `BZ_SETTLE_MS`), never with motion off. `bzTvFlood` is in `SHELL_USES_OK`. Help says it.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
