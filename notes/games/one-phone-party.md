# One-phone party games: the relay, the ask director, scores and take-backs

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

### Team mode for بدون كلام and أوصف لي (the relay)

Both were one timed round for one player. `JS_TeamRelay.html` wraps that
round for two teams: `relayStart` names the teams and the turns each, a
handover card (`relayHandoverHtml`) says whose turn it is and starts the
round the game always ran (`charadesRunTurn`, `describeRunTurn`),
`relayTurnDone` banks the words guessed as that team's points, and the
summary card shows the turn's points and the next handover, or the final
board once every turn is played. The relay lives in the game's own slice
of `appState` (`appState.charades.relay`), the options (`teamOpts`: mode,
names, turns) too, painted back onto the setup screen by
`paintSetupOptions`. ثلاث جولات already split into teams on its own.
A reload on the handover card or the final board comes back to it
(`restoreCharadesSummary` / `restoreDescribeSummary`); only a turn under way
(`turnLive`) goes back to the setup with «انتهت الجولة» (the audit of 6 Oct 2026).

### Who asks whom (the ask director)

الجاسوس and من أنا؟ both end in a free discussion against a clock, and the
same two people always end up asking everything. The setup screens of both
carry a `مين يسأل مين؟` switch (`JS_Director.html`): off is the old free
discussion; `order` walks the seating order and moves the target one seat
each lap; `random` always picks the player who has asked least and the one
who has been asked least. The rotation lives in the game's own slice of
`appState` (`appState.imposter.dir`, `appState.whoami.dir`), so a reload keeps
the count, and `paintDirector` draws the "X يسأل Y" card into the play screen
(`#imposter-director`, `#whoami-director`) with a Next button. The mode is
saved per game (`appState.imposter.config.director`, `appState.whoami.director`)
and painted back onto the switch by `paintSetupOptions`.

### Scores and take-backs on one phone

The pass-the-phone games keep score where the table can tap, and every
scored press can be taken back (the audit of 17 Sep 2026):

- القنبلة: with names picked on the setup, the boom asks whose hands it was
  in (tap the same name to take it back), the strikes board is kept across
  rounds, and "end game" is a podium of who survived most.
- فوازير إيموجي and كمّل المثل: with names picked, "مين عرفها؟" chips follow
  each reveal (`quizPointsReset` / `quizPointsToggle` in `JS_Emoji.html`,
  shared by both), with a live board and a podium at the end.
- خمس ثواني ends on `renderPodium`, and "one more round" keeps the scores.
- الحرباء and الموقع السري: "play again" deals to the same table and keeps a
  running score by the room rules.
- كلمة واحدة: 5, 10 or 13 rounds (`#justone-rounds`), an undo of the verdict,
  and a final score; its old confirm popup and timer are gone, which is what
  used to leave it stuck. A reload comes back (`restoreView`): the verdict or
  the final score as they were, a round mid-way dealt again with a fresh word
  for the same guesser, the round and score kept (the audit of 6 Oct 2026).
- ربع قرد: the board is saved before every move that can cost a quarter, so
  the winner popup offers "عكس الحكم" and "back to the board" - the verdict
  that decides the game can still be overruled. خلصت الكلمة has a ↶ for ✅
  and ⏭ (the ✅ that empties a round's deck too: `roundUndo`, from the next
  ready card or the finale, until the next turn judges a card); بدون كلام and أوصف لي clear their undo stack at every turn (team B
  could take back team A's card and score it).
- A relay match or a دوري المعرفة board left unfinished shows "continue" on
  its setup, and a new one asks before replacing it (`relayBegin`,
  `relayInProgress`; `tb_unfinished`).
- من أنا؟ never shows a player their own character: each step says "خبّي
  الموبايل عن X" and the others look. With shuffle on, everyone writes one in
  secret and a derangement deals them; off, the table types each player's
  while they look away. The count follows the players picked.
- Category lists are rebuilt for `contentLang()` in their setup painters
  (`paintWhoAmISetup`, `paintCharadesSetup`), keeping the pick by its emoji
  across languages - a stale list had dealt "Error" to every player.

**Content checks load some game files alone.** `tools/validate-content.js`
runs `JS_Charades.html`, `JS_DescribeIt.html`, `JS_JustOne.html`,
`JS_Stop.html` and `JS_TimesUp.html` by themselves to read their word lists,
without JS_Core: a top-level `onLeaveScreen` or `onLanguageChange` call in
those files has to be guarded with `typeof`.

## The ideas of 7 Oct 2026 (the owner's picks): built

- **640 بدون كلام: «مع الجرس», the last card counts.** When the clock runs out
  (`finishCharadesGame(true)` from the turn clock's end only; «إنهاء» is not the bell), the
  card on the screen (`charadesBellCard`: the last card dealt, not judged, and really showing,
  not one still flipping in) ends the turn's list as `{ w, ok: false, bell: true }`:
  untagged (🔔, no ✓ or ⏭) and marked «🔔 كان على الشاشة» (`charades_on_screen`,
  `partyTurnChipHtml` in `JS_TeamRelay.html`). One tap scores it, like any card in the list;
  in team mode it counts for the team when the turn is banked. أوصف لي is unchanged.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **676 كلمة واحدة: an exact guess judges itself** (rooms). `submitGuess` (`RoomJustOne.js`):
  when `normaliseClue(guess) === normaliseClue(word)` the round goes straight to `result`,
  `lastResult: 'correct'`, a point, `shared.exact: true`, with the reveal of the word and the
  removed clues; the host's صح / غلط are only for a near miss. The result card (phone,
  `rooms/JS_RoomGames.html`, and TV, `rooms/JS_RoomTv.html`) adds «✨ الكلمة بالظبط: اتحسبت لوحدها»
  (`jo_exact`) and the phone a confetti cheer through `afterReveal` (keyed by `motionFirst`). Help
  rule added. The robot plays the exact guess; the leak driver guesses a non-word.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **645 بدون كلام: «العب تاني» in the new language**: `startCharades(time)` reused the last category's words after Settings → لغة الألعاب changed. The deal now remembers its language (`appState.charades.catLang`, set in `charadesTakeSetup`); a replay in another language calls `charadesRetakeCategory()`: the same category matched by its icon (`matchCategoryKey`) in `CHARADES_DB[contentLang()]`.
- **653 أوصف لي: «مع الجرس»** (as بدون كلام's 640): when time runs out (`finishDescribeGame(true)` from the clock; «إنهاء» isn't the bell), the card on the screen ends the turn's list untagged, «🔔 كان على الشاشة», and one tap scores it (`describeBellCard`, the shared `partyTurnListHtml` / `partyTurnToggle`). Help says it.
- **658 ثلاث جولات: the turn's list after the bell**: when a turn's time runs out (`endTimesUpTurn`), the turn's cards come up as بدون كلام's fix-it list (`timesUpTurnCards`: each card once with its last verdict, the card up at the bell last with 🔔 and no verdict; `timesUpShowSum` in `#timesup-turn-sum`, a card added to `Controller.html`'s `view-play-timesup`). A ✅ taken back puts its card back in the bowl (at a random place) and its point goes; a ⏭ or the bell's card turned to ✅ leaves the bowl and scores (`timesUpSumToggle`). Every tap changes the game at once and is saved (`turnSum` in `appState.timesup`; a reload comes back to the list). «الدور اللي بعده» (`timesUpSumDone`) goes to the next team's ready card - or ends the round (round 3: the finale) when the list emptied the bowl. The turn rotates as before; a turn with no cards skips the list. A round emptied mid-turn by a ✅ has no list (its ↶ is `roundUndo`, as before). `endTimesUpTurn` now ignores a second call for the same turn (`turnEnded`). Help says it.
- **671 من أنا؟ in rooms: a small category deals twice**: `start` no longer throws «الكلمات أقل من عدد اللاعبين»: it deals what the prompt memory gives (up to the category's size) and then repeats from the category, shuffled, as the one phone does (`RoomWhoAmI.js`). Only an empty list is refused. My call: repeats from the same category, not a top-up from the mix (simpler, and the phone game does the same). Test: `rules.mjs`.
- **680 كلمة واحدة: joined words**: «كرة-قدم», «كرة_قدم» (and – —) are refused like a space, on the one phone (`joSubmitClue`), the room phone (`submitJustOneClue`'s check in `JS_RoomGames.html`) and the server (`submitClue` in `RoomJustOne.js`): `/[\s_\-–—]/`.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
