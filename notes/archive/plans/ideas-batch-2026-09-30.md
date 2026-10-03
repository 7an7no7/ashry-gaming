# The ideas batch of 30 Sep 2026 (the builders' notes)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

### The ideas batch (30 Sep 2026)

The owner asked for a look at every game for better looks, an easier way to play and more motion, and then said to build every idea of the review except five left for their decision (below). Six builders worked in parallel on their own branches, merged here. What each part does, where it lives, and what was decided while building:

#### Ideas batch: solo (built 30 Sep 2026, branch ideas/solo)

Everything below is on the page only (no Room*.js, no bundled list touched, so no
rules tests or deploy of the rooms server). New keys are in one `// ideas batch: solo`
block at the end of each TRANSLATIONS language; new CSS is the last section of
`Style.html`, `/* ===== IDEAS BATCH: SOLO ===== */`.

**1. خمن الكلمة: only the row just sent turns over**
- `renderWordleBoard(opts)` (JS_Wordle.html): finished rows are drawn settled (the old
  `animate-flip` on every row re-flipped all of them on every key). `opts.pop` pops only
  the newest typed letter; `opts.reveal` draws the row just sent with letters only
  (`data-res` on each tile) and `wordleReveal(r, win)` turns it over tile by tile
  (`WORDLE_FLIP_GAP` 250 ms apart, `WORDLE_FLIP_MS` 460 ms each, rotateX via Web
  Animations), each tile's colour class set by a timer at its halfway point. The
  keyboard's colours are drawn once the last tile lands (`renderKeyboard` from the
  reveal's timer; at once with motion off). A win bounces the row tile by tile.
- Typing waits while a row turns (`wordleRevealUntil`). The result sheet waits
  `wordleRevealMs(win) + 450`. A reload draws everything settled (no `reveal` passed).
- «الكلمة لسه ناقصة حروف» (`wordle_too_short`) with `playSound('thud')`, not the alarm.

**2. A soft miss sound**
- `playSound('miss')` (a soft falling sigh, the duels' lose) and `playSound('thud')` (a
  low knock) in JS_Core.html. `miss` replaced `alarm` for: a lost solo game
  (`soloResult`), a wrong Sudoku number, a wrong streak answer (both places), a lost
  Flags game, a Pinpoint round with 0, a Connections miss and a lost free Connections
  game. `alarm` is kept for real timers (the general timer, the chess clock, round
  clocks) and the one-phone party games' time-ups.
- Sudoku's wrong number: a medium buzz (was heavy), the cell shakes (`soloShake`), the
  mistakes count pops (`motionBump`).
- Shared little helpers in JS_Solo.html: `soloShake(el, px)`, `soloPop(el, k)`.

**3. خمّن الرقم: the window narrows**
- `gnWindow()` (what is still possible from the history; one-sided with the friend's
  secret) and `gnPaintWindow()` draw «بين 51 و 100» (`gn_window`, or `gn_more_than` /
  `gn_less_than` with only one bound) over a bar of the whole range whose lit part is the
  window (`translateX` + `scaleX`, a spring transition). Called from `gnPaintLocal`, so
  start, every guess and a reload all paint it. The text span gets the page's `dir` (the
  h3 is `.metric`, which holds text LTR).
- A guess outside the window is not a try: a line (`gn_between` etc.), a thud, the
  field and the window shake.

**4. 2048**
- The move fires on `pointermove` once past 24 px (one move per swipe), not only on
  lift. A swipe or key during the 120 ms slide is kept (`g2048Queued`, one, the latest)
  and played when the slide ends.
- `g2048Plus(n)`: "+N" rising from the score on a merge. `g2048TopBurst(v)`: a new
  highest tile (8 and up) pops with an amber ring (`.is-top`) after it lands.

**5. Minesweeper**
- The long press cancels after 8 px of movement (`minesPointerMove`; a cancelled hold's
  click is swallowed so a scroll never opens a cell) and shows a ring filling over
  `MINES_HOLD_MS` (`.mines-ring`). The right button still flags at once.
- A loss sets the other mines off in a chain outward from the one hit (`minesChain`:
  110 ms a ring, capped, fill `backwards`, a flash `.is-blown`); the sheet waits for it.
- A number tapped without enough flags pulses its closed neighbours (`minesPulse`), in
  a race too.

**6. Undo stacks (Queens, Tango, Nonogram)**
- JS_Solo.html: `soloUndoPush(s, snap)`, `soloUndoPop(s)`, `soloCanUndo(s)`,
  `soloUndoClear(s)`; the stack is `s.hist` (last 80). A board saved with the old
  one-step `s.undo` still takes that step back.
- Nonogram gained ↶ (`undoNonogram`, `#nono-undo`): one step per drag, a clear, a hint.
- Tango: a tap redraws only its cell (`tangoPaintCell`: the mark pops, the red outline
  of rule-breaking cells recomputed, the undo button's state) instead of the grid.

**7. Memory: a third tap during the miss pause**
- `memoryCloseMiss()` is the miss's close (the timer calls it); a tap on another card
  during the pause closes the missed pair at once and flips the new card; a tap on one of
  the two just closes them.

**8. Timer tool**
- Presets 30ث / 1 / 3 / 5 / 10 د (`genTimerPreset(seconds)`: stops whatever ran, sets and
  starts at once); a ring that drains round the time (`#gtm-ring-fill`,
  `stroke-dashoffset` from `tm.total`, red for the last 10 s). `tm.total` is the length
  set (grows if +1 is pressed while running). Its exit goes to الأدوات.

**9. Counter tool**
- `renderUniversalBoard` keeps its rows (keyed `data-univ-row`) and sorts them by score
  (ties keep their order) through `motionRowsSwap`; the leader (only when alone on top)
  wears 👑 and a gold ring. While a + / − is held the rows don't move; they re-sort when
  it lets go (`hold-repeat-end`).

**10. Hold to repeat (every stepper)**
- One delegated helper in JS_Utils.html: `.stepper__btn` (stepField), `.cs-step__btn`
  (csStep) and `[data-hold-repeat]` (the counter). Held 420 ms it repeats by calling the
  button's own click, 170 ms then faster (×0.86 a step, down to 45 ms). Stops on
  pointerup / cancel, the finger sliding 24 px off the button, the page hiding, blur, the
  button going away or being disabled. The click that ends a hold is swallowed (only that
  one: a new press clears it). A tap is still exactly one step.

**11. The solo result sheet**
- One main button (again), one «شارك» (`solo_share`; picture where the phone can send
  one, otherwise the words: `shareResultCard({ textFallback: true })` - a new option, no
  download), «شوف اللوحة» + «خروج» as ghost buttons side by side (`.solo-result-minor`).
  The text-share button stays in the markup, always hidden.
- A new record is a gold stamp «رقم قياسي!» (`#solo-result-stamp`, `solo_record_stamp`)
  that slams once (`motionFirst`, not on a reopened sheet). Recognised from `o.record`,
  or the caller's own `solo_new_best` / `bowl_new_best` title or line (no caller
  changed); that line is dropped and a title that only said "new best" hides.

**Decided while building (open to change)**
- The 2048 queue keeps the latest swipe, not the first.
- The new-highest-tile burst starts at 8 (4 would fire on nearly every early move).
- The Wordle keyboard stays on its old colours until the row has turned.
- On desktop «شارك» copies the text rather than downloading a picture.

**Tested**
- `npm run check` passes; `ONLY=screens npm run test:ui` 20 passed.
- Headless Chrome scripts (scratch `b-solo/`): 375x812 Arabic light, 667x375 English
  dark, 1280x720: Wordle reveal mid-flip, short word, win bounce, result, reload;
  Sudoku wrong; guess-number window and nudge and reload; 2048 swipe on move, queue,
  +N, top burst; mines ring, slide cancel, hold flag, chain, sheet; Queens/Tango/Nonogram
  undo (and legacy undo, reload with the stack); memory third tap; timer preset and ring;
  counter hold and sort and crown; setup stepper hold to max; result stamp; Wordle daily
  marked and shared. No console errors.

**Traps met**
- The Bash tool mangled a heredoc with `(ev === 'pointerup')`-style quoting inside a
  python heredoc; long edits went through the Edit tool instead.
- `.metric` holds its text left to right, so an Arabic sentence written into a metric
  element reads backwards ("100 بين 31 و") unless the text gets its own `dir`.

#### Ideas batch: party1 (one-phone party games)

All one-phone; nothing the rooms server runs changed. CSS: `/* ===== IDEAS BATCH: PARTY1 ===== */` at the end of Style.html. Keys: `// ideas batch: party1` at the end of both TRANSLATIONS blocks (pt_*, bm1_*, jo_check_*, jo_dup_*).

**1. بدون كلام: only the buttons score**
The card's `onclick="nextCharadesCard('correct')"` and its hint line («اضغط على الكارت لو خمّنوها صح») are gone from Controller.html; ✅ / ⏭ are the only way to score. The key `tap_card_correct` is now unreferenced (left in place). The `busyUntil` double-tap guard stays.

**2. The last three seconds on every one-phone clock**
`countdownUrgency(el, seconds)` (JS_Motion.html) is now called by: بدون كلام (`#charades-timer`), أوصف لي (`#desc-timer`), ثلاث جولات (`updateTimesUpClockUI`), خمس ثواني (`armFiveClock`'s paint in JS_RoomFiveSeconds.html - shared with the room and TV, so they get it too), من أنا؟ (only when it counts down, not the open-ended count up), الموقع السري (`updateSpyfallTimerUI`), أتوبيس كومبليت on one phone (`#stop-clock`). The number also reads red at 3-2-1 on those clocks (a CSS rule on `[data-count-at]`, scoped to their ids). Charades / describe call `countdownClear()` when a turn ends early.

**3. بدون كلام and أوصف لي: على راسك's rhythm**
- **3-2-1 before the clock** (`partyCountdown(view, host, onGo)` / `partyCountdownStop()` in JS_TeamRelay.html): the playing box gets `is-counting`, which hides the card's contents behind a big `.pt-count` number and holds ✅ / ⏭ / ↶ (CSS pointer-events, plus a JS guard in `nextCharadesCard` / `descAction`). It waits under Help/exit sheet, stops if the screen is left. Charades deals its first word at "go" (`charadesStartClock`); describe deals under the countdown (hidden) so the layout doesn't jump, and starts the clock at "go".
- **End-of-turn list**: `finishCharadesGame` / `finishDescribeGame` turn the turn's `judged` stack into `store.sum = { cards: [{ w, ok }], relay, at }` (the card on screen when time ran out was never judged, so it isn't listed - على راسك does the same). `partyTurnSummaryHtml` draws the score (counts up once, `motionFirst`), the chips (`.pt-chip`, tap = `charadesSumToggle(i)` / `describeSumToggle(i)` → `partyTurnToggle`, score and chip update in place, `motionBump`). One player: «لعبة جديدة» and «تغيير الفئة/الإعدادات» right there (the old result box, `charades-ui-result` / `desc-ui-result`, is kept in the markup but no longer shown). Team relay: «احسب النقط للفريق» (`charadesSumBank` / `describeSumBank`) banks the corrected score with `relayTurnDone`, then the usual relay summary/handover.
- **Undo** of the last card during a turn is unchanged.
- **Reload**: a turn under way is still lost (to setup + toastRoundLost, as before). The end-of-turn list is saved (`sum`) and comes back on reload (`restoreCharadesSummary` / `restoreDescribeSummary`, called from `restoreSavedView`). Decided: **leaving the screen with the list open** banks a team's points as they stand (the turn is theirs) and drops a one-player list (`charadesSumSettle` / `describeSumSettle`, onLeaveScreen).

**4. The bomb on one phone keeps its holder**
With names (2+): `b.holder` (an index into `b.players`, saved with the bomb state, restored on reload). The ticking screen shows «💣 القنبلة في إيد منى» inside the card and the seating order as chips under it, the holder lit with the mini bomb (`bombOneOrderHtml`). A tap on the big bomb or «💣 سلّم القنبلة» passes to the next name (`bombOnePass` → `bombOneGive`: hop + whoosh + tick, the mini bomb flies from the big bomb to the chip with `bombFlyChar`); a tap on a name gives it straight to that person (fixing a missed pass). The chips heat with the fuse. At the boom (`bombExplode`, and the reload path where it went off while away) `bombOneStrikeHolder` puts the strike on the holder; the existing picker still moves it (a hint line «لو كانت في إيد حد تاني، اختاره»). The next round starts in the loser's hands (a new game: the first name). Without names it plays exactly as before (the bomb tap just hops). On a phone on its side the three buttons share one row (`.bm1-actions`) so the bar doesn't cover the bomb.

**5. كلمة واحدة one phone: the writers' check**
After the last clue: a new phase `check` (`#jo-phase-check`, `joPaintCheck`): «خبّي الموبايل عن {guesser}» / «الكتّاب بس يبصوا», the secret word, every clue as a card with its writer. Exact duplicates (after `foldWord`) start crossed out (`jo.struck[i] = 'dup'`), shake once (`motionFirst('jo-dup:…')`, a buzzer) and a line per group: «كريم وسارة كتبوا نفس الكلمة!» (`joDupGroups`, `joNamesList`). A tap on any other clue crosses it out / brings it back (`joToggleClue`, 'close'). Decided: **duplicates stay crossed out** (the game's rule; a tap on one shakes it and says so). «📱 ادّي الموبايل لـ X» (`joShowGuess`) → the guesser's clues as big accent cards (`.jo-card`) turning over one by one with a tick each (`motionFirst('jo-deal:…')`, CSS `--i` delays), replacing the raw indigo Tailwind chips. The removed-clues note counts both kinds. Reload mid-round still goes back to setup (as before).

**Tests**
`npm run check` passes. Headless Chrome (scratch driver): ar and en (dark), 375×812, 667×375, 1280×720 - charades solo (countdown, no score under it, card tap doesn't score, urgency at 3, list, toggle, reload back to list), charades relay (bank corrected score), describe (countdown, list), bomb (pass by button/tap, strike on holder, moved by hand, next round starts with loser, holder restored on reload, no-names unchanged), Just One (dups struck, close toggle, dup locked, dealt cards); other clocks' urgency called directly. No console errors.

#### Ideas batch: party2 - the one-phone versions brought up to their rooms

Client only; no server, rules or list changed. Keys `imp1_*`, `wa1_*`, `spy1_*`,
`stop1_*` in one block `// ideas batch: party2` at the end of each language;
CSS in `/* ===== IDEAS BATCH: PARTY2 ===== */` at the end of Style.html.

**الجاسوس on one phone (JS_Imposter.html)**
- The play screen: «اتهموا حد» (`imp1OpenAccuse`) replaces «كشف الجواسيس»;
  «كشف من غير تصويت» (the existing `imp_reveal_direct` key) stays as the way out
  (`revealImposterResult` → `imp1Finish('revealed')`, no points, no line).
- The accusation is a popup of names (`#imp1-accuse-modal`, `imp1PaintAccuse`,
  `imp1Pick`): one tap picks (red, «دوس تاني للتأكيد»), a second tap on the same
  name confirms (`imp1Accuse`).
- Named a spy in الجاسوس: `#imp1-guess-modal` («هاتوا الموبايل لـ …») with six
  words, the secret among five others of its category (`imp1GuessOptions`: the
  spy list's category, or the tier-1 countries for «دول العالم»); a typed word
  has no list, so a named spy there is simply caught (decided here). المختلف
  named is caught at once (the room's rule). Wrong person: escaped.
  «إنهاء من غير تخمين» = caught (the room's skipGuess).
- Several spies: as the room - one accused; the outcome is everyone's
  (caught: +1 to every non-spy; escaped / guessed: +2 to each spy).
- The result (the shared winner-modal): the living spy plays the real verdict
  (`spyCastVerdict(outcome)`, no more «اتمسك / هرب» buttons on one phone), the
  room's outcome line (`imposterOutcomeLine` from JS_RoomImposter.html), the
  accused and the guess, the word and the spies, then `renderScoreboard` with
  `animateScoreboards`; confetti via `afterReveal` when caught.
- Score: `appState.imposter.scores` (by name) and `scoreId`, kept by «لعبة جديدة»
  (`playAgain` → `startImposterGame(players)`, `imp1Replay`), reset from the
  setup's Start. After a reload `lastSelectedPlayers` is empty, so the last
  deal's names are used (it used to open «مين بيلعب؟»).
- State: `appState.imposter.phase` ('reveal' | 'play' | 'guess' | 'done'),
  `accused`, `picked`, `outcome`, `guess`, `options`, `category`, `dealId`.
  Reload: `imp1Restore` (from restoreView's play-imposter branch) reopens the
  guess or the result; a result closed with the back button hides the live
  buttons (`#imp1-live`); the guess closed with back is reopened by «اتهموا حد».
- Trap met: «العب تاني» after a reload dealt an empty word - the setup's
  category list was never painted; `finalizeImposterGame` paints it when empty.
- Help (GAME_RULES imposter, both languages) updated.

**من أنا؟ on one phone (JS_WhoAmI.html)**
- During the clock `#wa1-got` shows a chip a player (`wa1PaintGot`); a tap marks
  «عرف» in order with its points, a second tap takes it back for exactly what it
  paid (the room's notYet; later ones keep theirs). Points `WA1_ORDER_POINTS`
  [3, 2, 1] - a copy of the server's `WHOAMI_ORDER_POINTS` (RoomGames.js is not
  on the page; keep the two the same).
- Everyone marked: a toast, then the characters are shown by themselves after
  1.1 s (the room reveals itself too).
- The result: `renderPodium` in `#wa1-podium` (key `whoami1` + `dealAt`), ✅ and
  +points on each row of the characters' list, confetti through `afterReveal`
  (no podium when nobody got theirs: confetti as before).
- One-phone من أنا؟ is still not restorable (a timed round: reload → setup).

**الموقع السري on one phone (JS_Spyfall.html)**
- A card of 24 places, the real one among them (`spy1DealCard`, `SPY1_CARD`,
  the room's SPYFALL_CARD), in `spyfallState.card` and its save; the board and
  the guess grid read `spy1Card()` (a deal saved before falls back to the whole
  list).
- «🕵️ أنا الجاسوس، هخمّن المكان» (existing `spy_guess_btn`) under the clock bar
  (`#spyfall-spyguess-btn`, hidden with the live controls once decided):
  `spy1VolunteerGuess` pauses the clock and opens the guess with its own title
  and a Cancel (`spy1CancelGuess` resumes it). Right = the spy's win, wrong =
  the table's, the room's spyGuess.

**أتوبيس كومبليت on one phone (JS_Stop.html)**
- Scoring one category at a time (`stop1PaintCat`): the letter big, the
  category, a three-way choice a player (فاضي 0 / مكررة 5 / لوحده 10,
  `stop1Set`), «الكل لوحده» and «الكل فاضي» (`stop1SetAll`), next / back, and
  «📋 الجدول كله». After the last category the whole table as before
  (`stop1PaintTable`, still tappable to correct; each column's head goes back
  to its category). `s.scoreCat` (index; = cats.length for the table) is saved,
  so a reload comes back to the same category; an older save without it shows
  the table.
- The letter is on the scoring screens (the card, and a chip on the table's
  head); round and category counts through `ltrFrac`.
- The end: `renderPodium` in the result popup (key `stop1` + `s.startedAt`),
  every place under it, confetti after the podium.
- The segmented choice has no sliding thumb: its active colours need
  `.segmented.stop1-seg .segmented__item…` to beat `.segmented.has-thumb
  .segmented__item.is-active { background: transparent }` (a trap worth noting).

**Tests**
- `npm run check` passes; `ONLY=screens npm run test:ui` 20 passed.
- Driven in headless Chrome (scripts in the scratch folder): each game through
  its new flow at 375x812 ar light, 667x375 en dark and 1280x720, reloads mid-
  guess, on the result, mid-category; no console errors.

#### Ideas batch: shell

Six items, all in the page (nothing the rooms server runs changed: no deploy of
the rooms server needed for this slice).

**1. One wording for "one phone / own phones"**

- `mode_device` / `mode_online` (the setup switch on ~30 screens) now say
  «موبايل واحد» / «كل واحد بموبايله» ("One phone" / "Own phones"), the words
  the hero, the home filters and «الليلة دي؟» use. The fallback text in
  `Controller.html` changed with them. `flt_room` and `mode_badge_room` said
  «من موبايله»; now «بموبايله» too, so there is one spelling.
- **The setup hero's mode pills are the switch** where a screen has one
  (`catalogHeroHtml(g, t, switchId)` in JS_Catalog.html): each pill is a
  button (`.meta-bit--pick`, `data-pmode` 'device' | 'online') calling
  `setPlayMode(id, side)`; the 📲 and 📺 pills are both the 'online' side. The
  lit side follows the switch: `heroSyncModes(view, mode)`, called from
  `applyPlayMode` (JS_RoomGames.html) and when the hero is built
  (`syncGameHero` reads the switch's active item). With no switch on the
  screen the pills are plain words (no background, no border, `--text-3`).
- CSS: the IDEAS BATCH: SHELL section at the end of Style.html.

**2. «الليلة دي؟» goes the way the table said**

`tonightGo(id)`:
- more than one person and "own phones" or "TV", and the game has a room:
  - a setup with the switch: `playModeOnce` = online, open the setup, press
    its online panel's primary button (so the catalog id → room id mapping is
    the setup's own, e.g. شطرنج → chess);
  - a room-only game: its catalog `open` (= `roomCreateFor`).
- "TV" **on a laptop or TV** (`tonightIsBigScreen()`: ≥900×540 with a fine
  pointer): this device opens the room as its big screen with the game chosen
  (`roomCreateScreenOnce` in JS_Room.html, consumed by the next
  `roomCreateFor`, which then does `Room.create('', gameId, true)` and shows
  `room-tv`). On a phone "TV" opens the room from the phone (the lobby's QR
  brings the TV in). Decided here: a phone can't be the TV.
- one phone (or "لوحدي"): `playModeOnce` = device, then `catalogQuickStart`
  for the games in `QUICK_START` (asks «مين بيلعب؟» when names are missing),
  else the setup. A phone that remembers "own phones" for that game still gets
  the one-phone side for this start (it isn't remembered).

**3. The recent row first**

A returning phone's home is now: «كمّل» card (item 4), the recent row
(`home-recent--slim`: a small head, tight margins), the featured poster, the
ways in, search, تحدي اليوم, the sections. The first visit's simple start is
untouched.

**4. «كمّل: …» on the home**

`HOME_CONT` (JS_Catalog.html, just before `renderHome`) is the registry:
`{ key, game (catalog id: title/icon/accent), view() (the play view), live(),
line(t)?, go() }`. Covered: بدون كلام / أوصف لي team relays
(`relayInProgress`, go = setup + `charadesResumeMatch` / `describeResumeMatch`),
دوري المعرفة (`triviaStarted`, `resumeTriviaBoard`), بنك الحظ, لودو, السلم
والتعبان, شطرنج, كونكت ٤, نقط ومربعات, حرب السفن, بولينج, ميني جولف (their own
`xContinue`), ربع قرد, سكرو's and الدومينو's score keepers, the solo boards with
`state().phase === 'play'` (`homeContSolo(id)`, go = `SOLO_GAMES[id].resume()`),
and a daily set aside (→ the تحدي اليوم hub). Lines where cheap: the relay's
turn, the board's round, سكرو's round, 2048's score, the daily.
- `homeContMark(from)` stamps `ashryContinue_v1[key] = Date.now()` on every
  `onLeaveScreen` from that game's view; `homeContPick` shows the live one with
  the newest stamp (unstamped = oldest). One card at most, never on a first
  visit, ✕ hides it for the visit (`homeContHidden`, fades out).
- A new one-phone game with a "continue" adds a line to `HOME_CONT`.
- Not included: games that can't honestly resume (a timed round mid-clock -
  بدون كلام without teams, كلمة واحدة, من أنا؟), card score keepers `cs-*`,
  المشنقة's endless tally, الذاكرة / إكس أو.

**5. The host's room list**

`renderRoomHub` → `roomHubListHtml(state, t)` (JS_Room.html): «✅ تنفع دلوقتي
(N)» with the tiles this room can start now, then `<details class="room-hub-more">`
«محتاجين ناس أكتر (N) ▾» with the rest (and switched-off games) under the
home's section heads (`tvHubGroupOf`). Opened state kept for the visit
(`roomHubMoreOpen`, the `data-r` trick against the toggle a drawn-open details
fires); open by itself when nothing is playable. A family opened (chess's ways,
the race) is one flat list as before. Poster markup moved to
`roomHubPosterHtml`, unchanged. The TV's host list is unchanged.

**6. The TV lobby with nobody in yet**

`tvLobby` (JS_RoomTv.html): a host TV whose room has no person yet draws
`tvLobbyEmptyHtml`: the QR big (min(60vmin, 42vw)) beside the code (1.35×),
«📷 امسحوا الكود» breathing (`tv-cta-pulse`, no-preference only), the join
address, the hint, and the chosen game if any («اللعبة: …»). When the first
person joins, the normal lobby comes back with `tv-lobby--arrive` once (the
side slides up, the QR column settles from 1.18×) and the strip chips of new
players pop (`tvStrip`, `motionFirst('tvchip|code|id')`, lobby only). One
column on a TV held upright. Checked at 1920×1080 and 1280×720.

**Keys added (one block, `// ideas batch: shell`)**

home_cont_label, home_cont_hide, home_cont_daily, home_cont_score,
room_hub_now, room_hub_more, tv_scan_cta, tv_empty_game.

**Seen, not touched**

On the host TV's list at 1280×720 `.tv-stage` overflows sideways by 6px (1263 in 1257), which draws a thin scrollbar under the
games (the `tv-hub-scroll` box) - it was there before this slice as far as I
can tell; worth a look.

#### Ideas batch: rooms

What the rooms slice built, on the page only (nothing the rooms server runs
changed: `at` was already in `shared.buzzes`, fibbage's results already carry
owners and voters).

**The staged reveal (JS_Motion.html, section 14; Style.html, IDEAS BATCH: ROOMS)**

`stageReveal(key, state)` returns a small helper for a reveal drawn into markup:

- `on` - `motionFirst(key)`, and only for a deal this page saw arrive more than
  1.5 s after it was first seen: `stageDealSeen` notes the first time
  `Room.onChange` sees each `roomDealKey`. A reload, a latecomer or a TV that
  comes on mid-result sees it settled (no `data-rv`, nothing moves).
- `at(ms, kind)` - ` data-rv="kind" style="--rv-at:Nms"`; kinds `in`, `pop`,
  `undim`, `win`, `flip` (a rotateX turn with a `.rv-cover` that goes when the
  card is edge-on).
- `count(to, ms, from)` - a `countUp` at that moment (the final text set by a
  timer too).
- `board(html, ms)` - a scoreboard that appears then counts up and slides
  (`animateScoreboards` held back by `data-seen` until its time).
- `end(extra)` - the `data-reveal-ms` that `afterReveal` waits for.
`stageRun(root, state)` starts the counts, the boards and the covers' removal;
`stageSound(state, name, ms)` plays on the TV itself or through `playRoomFx`.
Transform and opacity only; `prefers-reduced-motion` switches every part off.

**Item by item**

1. **Who is done, not a count, on the TV**: `tvWaitChips` in فيبج's writing,
   trivia's answering, زي الكل and صدق ولا كذب's writing, ارسم واكتب's step
   (its step note kept) and مافيا's night.
2. **فيبج's reveal** (`fibRevealPlan`, `fibRevealHtml`, `fibRevealRun` in
   JS_RoomVoting.html; the TV uses the same): the lies turn up one at a time,
   least picked first, 0.9 s apart, each «كذبة منى — ضحكت على 2» (or «محدش
   صدّقها»), then the truth flips last with who found it; ticks before it, a
   chime on it; on phones the points fly to the lie's author (500 a fooled
   player) and to the finders (1000), then the board counts up; confetti
   through `afterReveal` once the truth is up.
3. **موجة** (`wlReveal`, `wlRevealRun`): a shutter wipes off the bands from
   0.9 s while the needle pulses, then the verdict and «+N» pop and count up.
4. **مافيا's end** (`mafiaEndReveal`, `mafiaEndRun`): the role cards stay in
   seat order and flip at times ordered by role - citizens every 0.3 s, then
   Doctor / Detective / Lawyer every 0.55 s, then the Mafia every 0.7 s after a
   one-second drum roll (ticks, an alarm) - then the winners' title and the
   board. The narrator's line waits via `afterReveal`. On the TV's day result
   the news card flips before the vote count chips come in.
5. **Room trivia** (`triviaRevealPlan`, `triviaRevealRun`): the wrong choices
   dim one by one (0.8 s apart) and the right one pops and rings last, the
   counts counting up; on the phone the rows come in the same order. The TV
   between questions shows the board (`renderScoreboard` + count-up) under the
   fastest.
6. **الجرس** (`bzGapHtml`, `bzFinishHtml`): «+0.18ث» beside every queued buzz
   after the first (measured from the current first buzz); on the TV the first
   name big and, with two or more, a photo-finish strip (marks spread over at
   least 0.4 s, tags alternating high and low).
7. **الشاهد** (`witFeatureMatches`, `witTallyHtml`): after the sketch-beside-
   face comparison, chips per feature «الشعر ✓ النضارة ✗ …» pop in one by one,
   then «الرسام جاب 7/10». The tally counts the categories the real face's
   builder offers (`witCatsFor(real)`); a many-option category (marks, extras)
   is right only when every option matches.

**Decided here (open to change, each one place)**

- Mafia's rows keep seat order; only the flip times follow the roles, or the
  order would tell the table who is Mafia before the cards turn.
- A cover's text (the «?») never takes a role's colour or strike-through.
- Wavelength's big «+N» sits beside the verdict, not on the dial.
- The buzzer gap is from the current first buzz (after a wrong answer the next
  in line becomes the zero).

**Traps met**

- `afterReveal(el)` reads `data-reveal-ms` of el's descendants, not el's own:
  pass the parent.
- `body.is-tv-view .scoreboard` outweighs `.x .scoreboard`; a TV rule needs
  the `body.is-tv-view` prefix.
- `.metric` forces left-to-right: «+0.18ث» put the unit on the wrong side.
  The number is a `<bdi dir="ltr">`, the unit outside it.
- A flip with perspective `rotateY` warped wide cards; `rotateX` keeps them.
- A reveal keyed only with `motionFirst` replays after a reload (the memory is
  the page's); hence the fresh-deal guard in `stageReveal`.

**Tests**

`npm run check` (i18n OK), `test:rules` (the leak check clean; no server file
changed), and headless Chrome with four phones and a TV (375×812 ar light,
375×812 en dark, 667×375 ar, 390×844 ar dark, TV 1920×1080) through each
reveal, screenshots mid-way, a reload mid-result coming back settled, no
console errors. Scripts: the scratchpad's `b-rooms/t1.mjs` and `t3.mjs`.

#### Ideas batch: board (لودو, السلم والتعبان, أونو, بنك الحظ, the "you're next" cue)

**لودو: where each piece lands, on a touch screen too**
- `ludoLandMarks(board, c)` (JS_Ludo.html) draws, for every `.ludo-pc.is-movable`, one ring on the
  square it would land on (the hover path's `ludo-path--end`, plus `ludo-land`): «أكل» over a capture
  (`is-capture`, the existing `ludo_takes` label), ★ on a safe square (`is-safe`: on the track, no
  capture, `LUDO_SAFE`). Two pieces landing on one square (the yard's pieces on a 6) draw one ring.
- `ludoWire(root, c, onMove, delay)` gained `delay`: the marks wait for the roll's tumble (the value
  `ludoAfterPaint` returns), one phone and rooms alike; the timer is in `ludoFx.timers`, so a redraw
  cancels it. A tap on a piece clears them; the next frame has none anyway. The mouse's hover path
  still draws and clears only its own dots (`.ludo-path:not(.ludo-land)`).
- Decided: while choosing, the fx layer goes over the movable pieces (`.ludo-board.is-choosing
  .ludo-fx { z-index: 5 }`, it takes no taps) so a «أكل» label is never under a piece. The marks pulse
  gently (opacity only), still under reduced motion.

**السلم والتعبان: before your roll**
- `snkHintSync(k, on)` (JS_Snakes.html), called at the end of `snkSyncIdle` (so one phone and rooms):
  on your turn, when the roll button is ready and nothing is playing, a ring pulses at your piece's
  feet (`.snk-myring` in `c.under`) and the squares `snkReachOf(g, pid)` could reach (1-6, bouncing
  off 100 like the rules) get a rounded inset rect (`.snk-hint--snake` red where a snake's head is,
  `--ladder` green at a ladder's foot, `--plain` a dashed white edge). The rects are in a new layer
  `.snk-hints` right after `.snk-tiles`, under the ladders, snakes and numbers - nothing covers a
  number. Keyed on the game, `turnSeq` and your square; cleared the moment the roll is tapped
  (`snkLocalRoll`, `snkRoomRoll`) and whenever it isn't your ready turn. Never on the TV. Looks only.
- `snkSettleTo` empties `c.under`; the sync redraws a ring it finds disconnected.

**أونو: the colour picker counts, and "you're next"**
- `unoColorPickerHtml(state)` shows «(3)» after each colour (cards of that colour in your hand, wilds
  not counted) and an outline (`is-most`) on the colour(s) you hold most.
- «بعدك إنت 👀» (`room_next_up`): one shared helper, `roomNextUpCue(game, state, nextPid, moment)`
  in JS_RoomTurn.html. Each game works out who plays next from its own table in its turn-cue
  function and passes it; when that is this phone (never a screen), a light haptic once per moment
  and a pill fixed under the header (`.room-nextup`, `--z-toast`), gone when the state stops saying
  "you're next", after 6 s, on leaving the screen or when the room moves on (`onLeaveScreen`,
  `onRoomClocksReset`). Hooked into:
  - أونو (`unoTurnCue`): the seat after the one up in `s.dir`; moment = deal + the player up.
  - الدومينو (`domTurnCue`): the next seat still in the room.
  - لودو rooms (`ludoTurnCue`): the next seat not home; moment = the player up (a 6 doesn't buzz again).
  - إستميشن (`esTurnCue`): only while cards are played and the trick isn't about to complete
    (the auction and the calls skip seats; a trick's winner leads the next).
  - جمجمة (`sklTurnCue`): while discs are added and in the auction (passed players skipped).
  - Not with two players (you are always next) - uno/domino/ludo need 3+ seats, skull 3+ alive.
- Known: the pill can linger a moment into your own turn while the table is still animating the
  last move (أونو defers the redraw); it goes with the redraw.

**بنك الحظ: «🪄 دبّرها», the buy line, the build nudge**
- `bankRaiseDebt(g, priv, pid, rnd)` (BankAlhaz.js): the debt stage, the player's own debt only
  (`bankMustTurn`), refused - with nothing sold or mortgaged - when `bankLiquid` can't cover it;
  otherwise `bankRaise` (the bots' and the clock's sell-back-then-mortgage) then `bankPayDebt`.
  New room action `raise` (RoomBank.js, a turn move checked with `seq` like pay), and `raise` on one
  phone (`bankLocalDo`). The bar shows «🪄 دبّرها» in place of the greyed «ادفع» when the cash is
  short but the places cover it, with a line saying what it does (`bank_raise_can`).
- The buy question has a line (`bankBuyMeans`): «هيبقى معاك 2 من 3 الأحمر · يفضل معاك 1,280», or
  «هتكمّل الأحمر كله!» when it completes a colour; stations and companies count the same way
  («2 من 4 محطات»). Colour names are new keys `bank_col_*`.
- In the act stage, when any place can take a building (`bankCanBuildAny` = `bankCanBuild` on any of
  your places), the line is «🏗️ عندك لون كامل، تبني؟» and the 🏗️ button breathes (`.bank-nudge`).
- Rules tests (rules.mjs, "bank raise"): a stale seq does nothing; refused for someone whose debt it
  isn't; covers and pays (a station mortgaged for 100, 120 paid, 20 left); refused and nothing touched
  when it can't cover. The leak check passes (the rooms server needs a deploy for `raise`).

**Tests run**
- `cd tools && npm run check`: passes.
- `cd rooms-worker && npm run test:rules`: 0 failures, the leak check clean.
- Browser (headless Chrome, 375x812 and 667x375, Arabic and English): ludo against the phone (three
  movable pieces: two ★, one «أكل»; cleared on a tap), snakes against the phone (six squares, a red
  and a green, the ring; cleared on the roll), bank against the phone (buy line, nudge, raise-it which
  mortgaged and paid), an أونو room of two people and two bots (the pill seen on the next player,
  the picker's counts), and dominoes/estimation/skull/ludo rooms started with bots: no console errors.

**Left for the owner** (not built): an automatic «التالي» in the older room games (a lobby switch, off by default); a replay of the latest move in سكرو; a «🚫 ممنوعة!» button in أوصف لي and whether it costs a point; a hidden double card in دوري المعرفة; domino's passed-on numbers under the helper switch.
