# The five games of 15 Sep 2026 in rooms (صدق ولا كذب, فوازير إيموجي, كمّل المثل, خمس ثواني, ارسم واكتب)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**The five games of 15 Sep 2026** share what was already there:

- **صدق ولا كذب** (`twoTruthsAction`): each phone `submit`s three statements
  and the index of the lie; the server shuffles the three (so the lie is
  never "always the third") and keeps the index in `room._tt`. One
  storyteller at a time: their statements become vote options that all
  carry `ownerId: subject`, so the voting engine keeps them out of their
  own vote. `resolveTwoTruths` gives `TT_CATCH_POINTS` to each voter who
  picked the lie and `TT_FOOL_POINTS` per fooled voter to the storyteller.
  `closeWriting` lets the host start with whoever has written.
- **فوازير إيموجي and كمّل المثل** run on one engine (`quizAction`,
  `QUIZ_GAMES`): the deck is dealt at `start` through `nextPrompts`, each
  card reaches `shared.card` with its answer and alternatives stripped,
  `guess` compares through `normaliseClue` against `a` and `alt`, and the
  right answers score like the trivia (`QUIZ_POINTS` plus a speed bonus by
  order). `retry: true` (emoji) lets a wrong guess be shown to the table
  in `shared.feed` and tried again; `retry: false` (proverbs) takes one
  answer each. The card closes when everyone has answered, when the host
  presses `closeQuestion`, or by the server clock (`QUIZ_GRACE_MS`).
- **خمس ثواني** (`fiveSecondsAction`) deals its whole game from
  `BOMB_PROMPTS` at `start` (`room._fiveDeck`, `order × rounds`), so no
  per-turn action has to be a `DEAL_ACTION`. `go` (the player up, or the
  host) starts a five-second server clock; `roomTimeout` moves it to
  `judging`, and the host's `judge` scores and advances - only once the five seconds are up
  (`judging`), and for the turn the phone drew it for (`turn`: `round.turn`,
  `fiveRoomTurnKey`; the review of 1 Oct 2026: an early verdict was a double tap
  landing on the next player).
- **ارسم واكتب** (`telephoneAction`) starts one chain per player with a
  phrase from `DRAW_WORDS`. Step k gives chain c to player `(c + k) % n`,
  drawing on odd steps and writing on even ones; the previous step
  travels in `room.secrets[pid].task.prev`. Drawings arrive whole
  (`submit` with `strokes`, cleaned by `cleanStrokes` under the same
  budget as Draw & Guess) because the phone keeps them locally
  (`draw.local` in `JS_RoomDraw.html` turns the per-stroke flush off).
  A step ends when everyone has sent, or by the clock through a
  `collecting` grace like Stop's. The reveal publishes one chain at a
  time (`publishTelephoneChain`): a whole evening's drawings in every
  state push would be most of a phone's data. No scores.

### فوازير إيموجي and كمّل المثل on one phone: the play screen (1 Oct 2026)

From the owner's before/after sheet (it was three full-width buttons stacked under
the card and half the screen empty). `paintEmoji` and `paintProverb` draw one
screen, with the helpers in `JS_Emoji.html`: the card (`.quiz1-card`) takes the
height left, with the category and the round as chips on it (`quizCardChips`;
كمّل المثل has no category, so only «مثل N») and the emoji bigger; under it the
round's dots (`quizRoundDots`, the من أنا؟ writing step's `.wa-write__prog` with
`.quiz1-dots`): the game has no end, so they are ten to a row and the row starts
over every ten. Then "who got it?" and the board when names are kept, and the bar
at the foot (`quizPlayBar`, `.talk__actions`): «👀 كشف الإجابة» / «كشف الكلمة»
full width, «عدّي» and «خروج» (or «🏁 إنهاء اللعبة» when scoring) the quiet pair
under it; after the reveal «فزورة تانية» / «مثل تاني» takes the main slot and the
pair keeps the exit. The answer pops once on the tap (`emojiJustRevealed`,
`provJustRevealed`, `animate-pop`), not on a redraw or a reload. The CSS is in the
فوازير إيموجي · كمّل المثل block of `Style.html` (`.quiz1-*`); on a phone on its
side the bar is one line (the talk's rule).

**خمس ثواني between turns** (1 Oct 2026, the before/after sheet): the card says who is
up (`.five-up`, «قول 3 حاجات في 5 ثواني» on their own phone, `five_up_hint` on the
host's, «استنى دورك…» on the rest); the standings are a compact grid of name +
score tiles (`renderScoreboard(board, '', { grid: true })`, `.scoreboard--grid`,
`.score-tile`, the same `data-pid` / `data-score` so `animateScoreboards` still counts
up); «⏱ جاهز؟ ابدأ الـ5 ثواني» is the bottom bar's main action (`.five-bar`) for the
player up or the host, «عدّي اللاعب ده» small under it.


**One-phone خمس ثواني reads its own clock.** `armFiveClock(endsAt, loud, onEnd,
local)`: the one-phone turn passes `local`, since its `endsAt` is the phone's
`Date.now()`; read through `roomServerNow()` it was cut short or ran long by the gap
to the server whenever a room was still open on the phone.


**صدق ولا كذب: no lie marked by default** (the review of 1 Oct 2026). The writing
card starts with none of the three marked (`ttLie = null`), and «إرسال» asks for one
(`tt_need_lie`); the server already refused a sheet without `lie`.

**The English lists grown** (the review of 1 Oct 2026). كمّل المثل in English had 73
proverbs and فوازير إيموجي 128 riddles (the Arabic 160 and 198); now 164 and 232: the
sayings an English-speaking family finishes without thinking (Better safe than ___,
Haste makes ___, Once bitten, twice ___), and riddles in the five kinds already there -
Movies (Star Wars, Mary Poppins, Paddington), Animated films (Monsters, Inc., Mulan,
Peppa Pig), Idioms (Break a leg, Couch potato, Over the moon), Food (Koshari, Molokhia,
Cotton candy) and Places (Luxor, Venice, the Great Wall of China). The checks are the
ones the lists already had: one blank, the answer not written in the proverb, no answer
or emoji twice.

## The ideas of 7 Oct 2026 (the owner's picks): built

This file also keeps كذبة وصدقة (فيبج, `games/fibbage/RoomFibbage.js`) and مين أكثر واحد
(`games/mostlikely/RoomMostLikely.js`), whose screens are in `rooms/JS_RoomVoting.html`
and `rooms/JS_RoomTv.html`; neither had a notes file of its own.

- **589 كذبة وصدقة: the lie that is the truth.** `submitLie` refuses a lie that
  `fibbageLieIsTruth(lie, truth, question)` calls the truth: the same fold (digits ٠-٩ and
  ۰-۹ read as 0-9, `fibbageDigits`), or what `guessVerdict` calls right (the same stem,
  one letter off in a long word, a measure word: راس for راسه, كوب شاي for شاي), after
  dropping the question's own words from the lie («168 حرف» for «فيه ___ حرف» is 168). A
  number is its digits: «31 ألف» against «30 ألف» and 1931 against 1930 stay fair lies.
- **591 كذبة وصدقة: «متأكد ✌️».** Always there (the owner): a voter who is sure gets
  2000 for the truth instead of 1000, and a lie picked costs them 500 (the lie's writer
  still gets their 500); a score can go below 0 (chosen: the simplest, and it is what the
  table bet). Before voting it is a switch above the ballot (`fibSureHtml`, `fibSureArm`,
  sent with the vote as `sure: true` through `renderBallot`'s new `extra`, since the last
  vote closes the vote at once); after voting, while the vote is open, a button (action
  `sure { round }`, one way, stale rounds dropped). It stays on the server
  (`room._fibSure`) and on that phone only (`you.fibSure`, the round) until the reveal,
  which publishes `shared.sure` (ids): the reveal's names carry a ×2 chip, the truth's
  points fly as +2000 and a sure loser's −500 flies from the lie they picked
  (`fibRevealRun`). The TV shows the same reveal.
- **633 مين أكثر واحد: the votes scattered.** `scoreMostLikely`: when the top count is 1
  and the question was dealt to four or more (`MOST_LIKELY_SCATTER_MIN`), nobody scores and
  `shared.scattered` is set; the phone and the TV draw «الأصوات اتفرّقت» with no bar lit
  (`mltResultsHtml`). Three people tied on one vote still share the point.
- **596 صدق ولا كذب: the late sheet.** After `closeWriting`, a roster member who hasn't
  sent may still `submit` while the turns run (voting or a result): the sheet goes on the
  end of `s.order`, once; after the game is over it is refused. The phone keeps the writing
  card above the round for them (`ttWriteCardHtml(t, true)`, «الأدوار بدأت…»), other
  people's votes don't rebuild it, and what is typed (and the caret) survives the rebuilds
  that do happen (`ttDraft`, `ttDraftSave`, `ttRestoreDraft`).
- **603 فوازير إيموجي: «قرّب» for its guesser only.** A close guess goes into the feed
  as `{ n, name, close: true }` with no text; the text is in the guesser's own slice
  (`you.quiz.close[n]`, `quizSlice`), so only their phone shows it. Others read «🔥 عمر
  قرّب» (`quiz_close_other`), on the TV too. Wrong guesses are still shown to everyone.
- **611 كمّل المثل: «قرّبت؟ جرّب تاني».** In rooms a close answer (guessVerdict) is not
  spent: `room._quizNear`, «قرّبت! جرّب تاني، بنص النقط» on that phone (`you.quiz.near`),
  and the second try, if right, is worth half (`half`, `quizPointsFor`: half of the place's
  points, rounded up). A second close or wrong answer spends it.
- **612 كمّل المثل: three choices after 12 s.** `QUIZ_GAMES.proverbs.choicesMs`: each card
  has `shared.choicesAt`; the choices (the word and two other proverbs' words, none from
  this game's deck and none a spelling of the word: `quizChoicesFor`) wait in
  `room._quizChoices` and come down by the server's clock (`quizDeadline`,
  `quizTimeout`, called from `gameDeadline` / `gameTimeout` in RoomGames.js) as
  `shared.choices`. Action `pick { i, qIndex }`: right is half the points, wrong is 0 and
  spends the answer; typing still pays full. They show under the box for anyone who hasn't
  answered (`quizExtrasHtml`, drawn in place so the box keeps what is typed) and as chips
  on the TV.

Tests: `rules.mjs` (each number), `leaks.mjs` (the choices wait for their time and carry
the word only there; a close text on its guesser's phone only; who is sure stays on their
own phone while voting; a late sheet in صدق ولا كذب), `play-all.mjs` core (the sure votes,
the choices coming down).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
