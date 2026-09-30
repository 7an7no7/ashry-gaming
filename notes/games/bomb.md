# القنبلة (id `bomb`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**القنبلة's bomb is a character** (27 Sep 2026, the living-characters brief;
the end of `JS_Bomb.html`, section 44 of `Style.html`), in المشنقة's flat
cartoon: `bombCharSvg({ heat, size })` draws a round black bomb with a
highlight, a cap, a fuse in four pieces and a face, `bm-h0..3` on the svg.
Calm and grinning at 0, eyes open at 1, wide eyes, a wobbly mouth and sweat at
2, a gasp, tiny pupils and a hard shake at 3; a heat step fades the fuse's
outermost piece and the spark slides down to the new tip (`bombCharHeat`,
switched in place - a room's `shared.heat` is no longer in the frame's
signature, and the one-phone fuse steps at the server's `BOMB_HEAT_AT`, 40%,
65% and 85% of it, `bombHeatOf`); every tick squashes it (`bombCharTick`).
A line a heat (`bomb_bub_0..3`: «سلّم!», «بسرعة!», «مش أنا!», «هتفرقع!»)
pops now and then on the big ones. Sizes: `big` on one phone, on the
holder's phone and on the TV (beside the category there, so the order stays
on screen); `small` on the other phones; `mini` on the holder's chip in the
order row. **A pass flies** (`bombRoomCharacter`, after every draw on a phone
and the TV): a small bomb in an arc from the last holder's chip - or from
this phone's own big bomb when it passed - into the new holder's chip, or into
the big bomb on the phone it was handed to (`bombFlyChar`, the place held
until it lands, keyed with `motionFirst` on the passes); the TV's big bomb
hops; one phone has no pass, so a tap on the bomb (and «فئة تانية») makes it
hop. **The explosion** (`bombBoomSvg`, `bombBoomFx`): the bomb swells and
shakes, a flash, a fireball, eight pieces of shell fly off, smoke rolls up,
then the remains (a soot mark, the cap, shards, a wisp); at the burst the
screen shakes, soot smudges cover it for a second (`.bm-soot`), the boom
(`FX.bombBoom`, added on first use since `JS_Sounds.html` loads later) on
the loser's phone and the TV (every phone when there is no TV), the loser's
chip is blown back and stays singed (`bomb-order__loser`, shown on the boom
screen too) and the strike pops on the board (`bm-strike-new`; on one phone
when the name is picked). It plays once a round, only on a page that saw that
round's fuse burning (`bombFx.sawTicking`; a reload or a late join sees the
remains), and a redraw in the middle carries on from `--bm-late`.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
