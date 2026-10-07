# القنبلة (id `bomb`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**القنبلة's bomb is a character** (27 Sep 2026, the living-characters brief;
the end of `JS_Bomb.html`, section 44 of `Style_Living.html`), in المشنقة's flat
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

### The one-phone bar (1 Oct 2026)

With names kept, the bar is the talk's (`.talk__actions`): «💣 سلّم القنبلة»
full width, «فئة تانية» and «خروج» the quiet pair under it (one row on a phone on
its side; the old `.bm1-actions` grid is gone). Without names, «فئة تانية» stays
the big button and «خروج» is a small quiet one under it (`.play-exit`), side by
side on a phone on its side. Upright the bar sits at the foot of the screen
(`.play-foot`, *The bar of the solo games* in `notes/games/solo.md`).

**The review of 1 Oct 2026.** `swap` carries `swaps` (how many times the host has
swapped this round, `shared.swaps`): a double tap used to burn two categories. And
the heat steps are no longer fixed at 40/65/85% of the fuse: each round draws its own
(`bombHeatSteps`, each moved up to ±8% and kept in order, in `room._bombHeatAt` on
the server), so timing the first step no longer tells the table when it goes off.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **699 One phone's fuse can't be timed.** `BOMB_HEAT_AT`, `BOMB_HEAT_JITTER` and `bombHeatSteps`
  moved from `RoomBomb.js` into `BombPrompts.js` (shared by the page and the server, one copy).
  `startBombRound` deals `appState.bomb.heatAt = bombHeatSteps()` each round (saved, so a reload
  ticks the same steps), and `bombHeatOf(total, remaining, steps)` reads it (a round saved before
  it: the fixed steps). `BOMB_HEAT_AT_PAGE` is gone.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **703 the boom's replay on the TV**: the server keeps the round's hands, `shared.trail` (the starter, then every pass; a send-back takes its pass off; the last 40, `BOMB_TRAIL_MAX`) - who held the bomb is public, the fuse stays secret. After the explosion (`BOMB_BOOM_MS`), a TV that saw it go off replays the last 12 passes (`bombTvReplay` → `bombTvReplayRun` in `JS_RoomBomb.html`): a little 💣 arcs from name to name over the TV's order strip (`.tv-order [data-bm-pid]`), 0.19 s a hop and 0.9 s for the last one into the loser's hands, each name it lands on pulsing, with a «🔁 الإعادة» tag at the top (`.bomb-replay`, `.bomb-replay__tag` in `Style_Party.html`, `bomb_replay`). Once per round (`motionFirst`), never with motion off; it stops if the TV redraws its names. Help says it.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
