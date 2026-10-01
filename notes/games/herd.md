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

The room's send button is the standard one (1 Oct 2026): `btn btn--primary btn--send`
with «إرسال» beside the field, as in ارسم وخمّن (it was a ✓ square).


**Out of rounds, ties share it** (the review of 1 Oct 2026): at `HERD_MAX_ROUNDS` with
nobody at the target, `shared.winners` is everyone level at the top (the sheep and
the watchers aside), not only the first row.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
