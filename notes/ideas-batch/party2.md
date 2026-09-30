# Ideas batch: party2 - the one-phone versions brought up to their rooms

Client only; no server, rules or list changed. Keys `imp1_*`, `wa1_*`, `spy1_*`,
`stop1_*` in one block `// ideas batch: party2` at the end of each language;
CSS in `/* ===== IDEAS BATCH: PARTY2 ===== */` at the end of Style.html.

## الجاسوس on one phone (JS_Imposter.html)
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

## من أنا؟ on one phone (JS_WhoAmI.html)
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

## الموقع السري on one phone (JS_Spyfall.html)
- A card of 24 places, the real one among them (`spy1DealCard`, `SPY1_CARD`,
  the room's SPYFALL_CARD), in `spyfallState.card` and its save; the board and
  the guess grid read `spy1Card()` (a deal saved before falls back to the whole
  list).
- «🕵️ أنا الجاسوس، هخمّن المكان» (existing `spy_guess_btn`) under the clock bar
  (`#spyfall-spyguess-btn`, hidden with the live controls once decided):
  `spy1VolunteerGuess` pauses the clock and opens the guess with its own title
  and a Cancel (`spy1CancelGuess` resumes it). Right = the spy's win, wrong =
  the table's, the room's spyGuess.

## أتوبيس كومبليت on one phone (JS_Stop.html)
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

## Tests
- `npm run check` passes; `ONLY=screens npm run test:ui` 20 passed.
- Driven in headless Chrome (scripts in the scratch folder): each game through
  its new flow at 375x812 ar light, 667x375 en dark and 1280x720, reloads mid-
  guess, on the result, mid-category; no console errors.
