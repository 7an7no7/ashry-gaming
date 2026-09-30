# Trivia: room trivia and دوري المعرفة

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Decided, and why

- **دوري المعرفة has a steal** (owner, 24 Sep 2026: the usual party rule). A
  setup switch, «فرصة للفريق التاني (سرقة)», on by default and remembered with
  the team names. When the team up misses (the host's ❌) or its clock runs
  out, the answer stays hidden, a band says «فرصة للفريق التاني», and the other
  team gets one try on a clock of half the card's time (none with the clock
  off): ✅ is the card's full points to them, ❌ or the clock shows the answer
  and nobody scores. The turn passes after every card as before. Decided here
  (open to change, one place each in `JS_TriviaBoard.html`): the board had no
  turn of its own, so it keeps one now (`turn`, the team up next, ringed on
  the scores, passing to the other team after every card whoever scored) and
  the card says who is answering with a two-team switch the host can correct
  (`open.picker`); «👁️ إظهار الإجابة» stays in the first stage and **skips the
  steal** - the answer is out, so the host gets today's award buttons (either
  team or nobody) - rather than being hidden; half the time is rounded up (15
  of 30, 8 of 15); a steal missed shows only «محدش خد النقط» and «التالي» (a
  wrong call is put right with «رجّع آخر سؤال», which also gives the turn
  back). Off, a card plays exactly as it always did.

## From GEMINI.md: Multiplayer rooms

**Trivia, two modes.** The room version deals from `TRIVIA_QUESTIONS` on the
server. The host picks 5, 10, 15 or 20 questions (`TRIVIA_COUNTS`). A right
answer is `TRIVIA_POINTS` (10) plus a speed bonus: +5 for the first right
answer, +4 for the second, down to nothing from the sixth. The order is the
time the server received each answer, ties going to whoever arrived first
(`seq`), and `shared.order` publishes it so every phone can show its place.
The title at the end (`shared.fastest`, who was first right most often) says
what its number is: «⚡ أسرع إجابة: منى · في 3 أسئلة» (`renderAward`'s
`countHtml`, `awardFirstTimes`; the number held left to right).

The team board (*دوري المعرفة*) is single-screen: `JS_TriviaBoard.html`, with its
own bank in `JS_TriviaBoardBank.html` — ten categories, sixteen or more questions
at each of 100–500, the higher the harder. Only facts that don't change (no
records, current title holders or "the latest"). The validator only catches a
question written twice word for word, so before adding, compare new answers with
the existing ones across *all* categories: most repeats are the same fact asked
the other way round ("what is tahini made from?" against "which sauce is made
from sesame? — tahini"). `npm run export:trivia -- <path>` in `tools/`
writes the same bank as `trivia_bank.js` for the standalone trivia page
(`trivia.html`).

A board question can run on a clock: the setup screen's switch and 15–60 seconds
(`TB_TIMER_CHOICES`, on at 30 by default, remembered with the team names in
`ashryTriviaTeams`). Tapping the clock pauses it; when it runs out the answer
shows by itself, and the host still gives the points. The open card lives in
`appState.triviaBoard.open` with a deadline (`endsAt`, or `left` while paused),
so a reload reopens it with the time it really had left.

**The steal** (a setup switch, on by default, `steal` in `ashryTriviaTeams`
and on the board; *Decided, and why*). With it on the board keeps `turn` (the
team up next, `is-turn` on its score) and an open card has `stage`
('first' | 'steal'), `picker` (the team it went to first, from `turn`, switchable
on the card with `setTriviaPicker`) and `secs` (the stage's whole length, for
the bar). `paintTriviaActions` draws the host's buttons for the stage;
`judgeTriviaCell(right)` is ✅ / ❌; `enterTriviaSteal` (❌, or the first
clock in `triviaTimeUp`) restarts the clock at half the card's time with a new
`endsAt`, and the band slides in once (`motionFirst`); a verdict in the steal's
first 600 ms (`TB_STEAL_GUARD_MS` from `open.stageAt`) is dropped as the second
tap of a double tap on ❌, which used to run first miss, steal and steal missed
in one go; `missTriviaSteal` (❌,
or the steal's clock) sets `open.missed` and reveals the answer, and
`paintTriviaAnswer` then offers only «التالي» (`awardTriviaCell(-1)`).
`awardTriviaCell` passes the turn and keeps the turn before in `last`, so
`undoTriviaAward` gives it back. A board saved before the switch has no
`steal` and plays as it always did.

## From GEMINI.md: Next batch: small (three owner-approved touches)

**2. دوري المعرفة: the hidden double card (JS_TriviaBoard.html)**

Decided while building (open to change, each in one place):
- **One hidden double card per board** (`cell.dbl`), dealt at random among the 200-500
  cards when the board is made (`tbDealBoard(previousIds, withDouble)`, wrapping
  `dealTriviaRound`; used by the start, the next round and play again). Never a 100.
- **A setup switch «كارت دبل»** (`#tb-double-on`, on by default), remembered in
  `ashryTriviaTeams` as `double`; the board keeps it as `s.double` for its later rounds.
  A board saved before it has no `double` and no `dbl` cells: it plays as before.
- **Nothing shows it until opened.** Opening it: `slamBanner('🎯 كارت دبل!', 'النقط
  متضاعفة ×2')` in gold (`.tb-dbl-slam`), the tada, a buzz, the points badge pops
  (`motionBump`); the badge says `×2 · 800` (×2 in a `<bdi dir="ltr">`) in gold
  (`.tb-q-points--double`). The slam plays once per opening (`open.dblSeen`, saved, so a
  reload mid-card shows the card settled, still double). The card's clock starts after
  the slam: `open.endsAt` is set `TB_DBL_MS` (1.2 s) later at open, and
  `tbDoubleReveal` starts the clock when the slam is over. Motion off: no slam, no delay.
- **Points** go through `tbCellPoints(cell)` everywhere they are counted: the award, the
  steal band's points (`tbOpenPoints`), and `s.last.points` - so «رجّع آخر سؤال» takes
  exactly the doubled points off. Stolen, the other team gets the double.
- A played double card keeps a small `×2` (`.tb-x2`) on its cell; an undone one goes back
  to looking like any card (still double, and its slam plays again when reopened).
- GAME_RULES (both languages): a line under the steal.
- Found on the way: "×2 · 400" written as plain text in an Arabic badge reads "400 · 2×";
  the ×2 needs its own left-to-right isolate.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
