# زي الكل (id `herd`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**زي الكل in rooms** (`herdAction`, `JS_RoomHerd.html`). One question for
everyone ("اكتب حاجة واحدة من: فواكه"), dealt through `nextPrompt` from the
Chameleon categories and the bomb's (`herdPrompts`, without the bomb's
"حاجات في …" places; the property kinds, "حاجات بتطير" and the like, left the
bomb's list on 26 Sep 2026). Answers wait in
`room._herd.answers` until every phone has sent or the host presses
`closeWriting`; then `herdGroups` groups them through `normaliseClue`, so قطة
and القطه are one answer. In `reveal` the host can `merge` two groups that
mean the same thing (tap one, then the other; `unmerge` puts them back) and
then `score`: the single biggest group of two or more gets a point each, a tie
for biggest scores nobody, and if exactly one player stands alone they take
the sheep (`sheepId`) from whoever had it. Nobody holding the sheep can win:
the first to the host's target (5, 8 or 10, `ashryHerdOpts`) without it wins.
At the game's end whoever holds it goes last on `shared.board` (with `tie: 'sheep'`),
so the night, الشلة and «مين هيكسب؟» never place them first, and they stand on no
podium step (`herdPodiumBoard`; the audit of 6 Oct 2026).

The room's send button is the standard one (1 Oct 2026): `btn btn--primary btn--send`
with «إرسال» beside the field, as in ارسم وخمّن (it was a ✓ square).


**Out of rounds, ties share it** (the review of 1 Oct 2026): at `HERD_MAX_ROUNDS` with
nobody at the target, `shared.winners` is everyone level at the top (the sheep and
the watchers aside), not only the first row.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **708 Undo the last merge only.** Every `merge` pushes the groups as they were onto
  `room._herd.stack` (server-only) and publishes `shared.merges`; `unmerge { n }` pops one (`n`, the
  merges the host saw, guards a double tap through `staleTap`; with no stack it regroups from the
  answers as before, for an old phone), leaving out anyone who left since. The button
  («↶ رجّع آخر تجميع», phone and TV) shows while `merges > 0` (`herdCanUnmerge`, `herdUnmergeCall`;
  an older server with no `merges`: the old test).
- **710 «اختار يا خروف».** When a round is dealt with the sheep at the table, `dealHerdRound` deals
  three questions (`nextPrompts`, `HERD_PICK_FROM`) into `shared.choices` and goes to phase `pick`
  (`shared.picker`, `pickerName`); the holder's phone shows the three as buttons («اختار يا
  خروف!»), everyone else and the TV the three and «… بيختار السؤال», and the move-on side a ghost
  «اختار بداله» that lets the app pick at random. `pickPrompt { i, round }` (`herdPick`): the
  sheep's choice, or anyone else through `requireMoveOn` at random; a stale round does nothing. The
  question then shows «🐑 … اختار السؤال ده» (`pickedBy`). The picker leaving: the app picks
  (`roomPlayerLeft`'s herd case). «دورك!» says it to the picker (`herd_turn_pick`, `roomTurnOf`).
  No sheep (the first rounds): dealt as before. Help rules updated; rules tests and the robot.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
