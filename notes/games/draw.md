# ارسم وخمّن and the drawing tools (ارسم واكتب, الفنان المزيف)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**Draw & Guess words are things a phone can draw and a table can name.** (23 Sep
2026: the owner met ترومبيت and didn't know it; طوقان, ساكسفون, إكسيليفون, هارب,
يعسوب, بوق and رنة went with it - 682 words.) The
owner was dealt خلد (17 Sep 2026). The Arabic list had grown to 900 with a
bulk of animals, dishes, herbs and body parts (قضاعة, نيص, رتيلاء, بصارة,
عرقسوس, شريان) that nobody can draw or would guess; it is 690 curated words
now, one form per thing (طماطم, not also حبة طماطم and طماطماية, which the
judge treats as one anyway). A word goes in only if a sketch of it is
recognisable in a minute and the Arabic name is the one an Egyptian family
uses.

**The drawing tools** are one builder, `drawToolsHtml` in `JS_RoomDraw.html`,
used by Draw & Guess (undo on the server) and ارسم واكتب (undo on the phone):
pen, line, rectangle, circle, fill and eraser; fifteen colours and a custom
swatch over the phone's colour picker, in two rows of eight; four
thicknesses with undo, redo (`draw.redo`, the strokes undo took, until the
next new stroke) and clear; Ctrl+Z / Ctrl+Y on a laptop through
`draw.onUndo` / `onRedo`.
Freehand replays as one smooth path through the midpoints (`drawStroke`);
the finger's live preview is still segment by segment, and every canvas is
replayed from the list when the stroke lands, so the pixels agree. The
guessers get the word's shape (`shared.hint`, a dash per letter) and a
near miss is flagged `close` (`stringSimilarity` ≥ 0.7 on the folded words).

**Draw & Guess strokes carry a tool letter.** `t` is absent for freehand — which
is what every stroke made before the tools existed is, so old rooms replay
unchanged — and `l`/`r`/`o`/`b` for line, rectangle, ellipse and fill. Shapes
store their two corners (4 numbers) and a fill stores one point, so they are far
cheaper than the freehand strokes they replace: a hand-drawn circle is fifty
points, the circle tool is four. The eraser is not a tool letter at all, just a
freehand stroke in the paper colour, which replays with no special case.

**The drawer must see exactly what the room sees.** That property is easy to
lose and worth testing by rendering the shared list onto a blank canvas and
diffing it against the drawer's own, pixel by pixel. Three separate things broke
it while this was being built, all of the same shape — the drawer's canvas is
built from live input, everyone else's from a replay:

  * `Room.act` emits the new state to the renderer *before* it returns, so the
    drawer's own batch came back and was painted a second time on top of itself;
  * a poll landing mid-drag repainted underneath the stroke being drawn and
    threw away the snapshot the shape rubber-band restores from, so the preview
    stacked on itself and the edges went dark;
  * freehand was drawn segment by segment live but as one joined polyline on
    replay, which blends corners differently.

The first is now handled by replaying the shared list after every send rather
than trusting the canvas to already match, the second by refusing to repaint
while `draw.drawing`, and the third by replaying freehand segment by segment
too. A full replay costs well under a millisecond and happens after every send.

**Draw & Guess draws live.** The drawer paints locally and immediately, shares
the line under the finger every 80ms (`Room.sendLive`), and sends each finished
stroke 0.2s after the finger lifts (`addStrokes`). Viewers draw the live line as
it arrives, then repaint from the room's stroke list once the finished stroke
lands (`paintStrokes` replays from the paper up when a live line was showing),
so every phone ends with the same pixels and a lost piece repairs itself. Live
pieces overlap by one point and carry their start index, so a piece arriving
out of order is dropped rather than drawn in the wrong place. Shapes and fills
are not shared live; they appear when finished.

Coordinates are quantised to a 0–255 grid and packed flat (`[x,y,x,y,…]`), with a
hard budget of `DRAW_MAX_POINTS`; a stroke that would exceed it is truncated, not
dropped, so the drawing degrades rather than breaking.

## الفنان المزيف: the fake leaves mid-round (1 Oct 2026)

When the fake's phone leaves during the drawing or the vote the server ends
the round as a reveal (`shared.impostorLeft`, `fakeId`, `fakeCaught: false`,
nobody scores), as the three spy games do. The phone and the TV then say
`room_impostor_left` with the fake's name (`faResultLine`, `faFakeName`:
`shared.fakeName` first, since the fake is no longer among the players), with
no "caught"/"escaped" cast and a neutral card, instead of «الفنان المزيف عدّى».

A rebuild on my turn (a new host, the language) keeps my unsent line and turns
its Send back on; the caught fake's guess box keeps what was typed (`keep`).

**The drawer walks a shuffled order** (the review of 1 Oct 2026). ارسم وخمّن used to
pick the drawer as `round % players`, so a join or a leave made someone draw twice
and someone never. `roomTurnStep` (RoomGames.js, shared with كلمة واحدة) keeps a
shuffled order in `shared.turnOrder` and the pointer in `shared.turnAt`; each
`nextRound` drops whoever left (moving the pointer back for each one at or before
it, like المشنقة's `setterAt`), adds latecomers at the end, and steps on. A new game
(`start`) shuffles afresh.

## الفنان المزيف: the fake knows the category (the review of 1 Oct 2026)

As in the original game, the fake is told what kind of thing the word is.
`DRAW_WORDS` is now built from `DRAW_WORD_CATS` in `PartyContent.js`: every
drawing word filed under one category (18 kinds in each language: حيوانات, أكل
وشرب, حاجات البيت, عدة وأدوات, مدرسة ومكتب, أجهزة, لبس وإكسسوارات, مواصلات, أماكن
ومباني, طبيعة, جسم الإنسان, رياضة ولعب, آلات موسيقية, ناس وشخصيات, حواديت ومغامرات,
أعياد ومناسبات, رموز وعلامات, حاجات طبية; the English list the same kinds), with
`DRAW_WORDS.ar` / `.en` the flat lists every drawing game deals from, so ارسم وخمّن
and ارسم واكتب are unchanged. `drawWordCategory(lang, word)` finds a word's
category; `fakeArtistAction`'s deal puts `category` in every slice (the fake's
`{ isFake, category }`, the painters' `{ isFake, word, category }`), and the role
card shows «الفئة: …» under the word or the ❓ (`fa_category`). An older server
deals none and the line is left out. `validate-content.js` checks every category
has 5+ words and that no word is spelled inside its own category's name (مكتب sat
in «مدرسة ومكتب» and moved to the house), and `rules.mjs` that the fake's slice
has the category and never the word.

## The ideas of 7 Oct 2026 (the owner's picks): built

ارسم وخمّن (`games/draw/RoomDraw.js`, `JS_RoomDraw.html`, the TV in `rooms/JS_RoomTv.html`):

- **565 «قرّب» من غير ما يتقري.** A close guess goes into `shared.guesses` with no
  text (`{ n, name, text: '', close: true }`); its spelling goes to the guesser's own
  slice, `secrets[pid].guesses = [{ n, text }]`, matched by the guess's number
  (`shared.guessSeq`). `paintGuessList(guesses, state)` shows the guesser their own
  text with 🔥 قريب, and everyone else (and the TV) «🔥 خالد قرّب» (`draw_came_close`).
  The leak check has a rule for it ("a close guess is spelled only on its guesser's
  phone") and its driver makes a close guess every round.
- **566 ضربة سريعة.** A right guess in the first third of the round's clock
  (`endsAt - roundSeconds` to a third of the way) sets `shared.quick`: the guesser 3,
  the drawer 2 (instead of 2 and 1). The stamp reads «⚡ خمّن صح!», and the result
  card (and the TV's panel) carries «⚡ ضربة سريعة…» (`draw_quick_line`), so it shows
  with motion off too.
- **567 «قول الفئة».** The drawer's button (`drawTellCategory`, with a confirm) sends
  `tellCategory`; the server sets `shared.category` from `drawWordCategory(lang,
  word)` (DRAW_WORD_CATS) and the drawer gets no point that round - the quick bonus
  included (my call: "gives up their point for the round" read as nothing at all);
  the guesser still scores 2 (3 when quick). `shared.catOk` says whether the word
  has a category (false for «كلماتنا» words, whose button is not shown; the server
  refuses them too). Painted in place (`drawPaintCategory`, `#draw-cat`) on the
  phones and the TV, so telling it doesn't rebuild the frame under a guess being typed.
- **569 تخمين المتفرجين.** `ROOM_GAMES.drawguess.lateJoin = true`: a latecomer sees
  the drawing with a guess box and a line saying it's for fun (`draw_watch_hint`).
  Their guesses carry `watcher: true` (👀 on the list and the TV) and never score;
  a watcher's right guess doesn't end the round and is printed only on their own
  phone («👀 سارة ✅ عرفها» for the rest), like a close one. They're on the roster
  from the next round (`nextRound` takes `room.players`).

ارسم واكتب (`games/telephone/`):

- **573 لفّة كمان.** A lobby switch for the host while the room has 3 or 4 people
  (`teleTwiceOn` / `teleSetTwice`, remembered with `recallOptions('teleRoom')`),
  sent as `twice: true`; the server (`TELE_TWICE_MAX` 4) makes the chain
  `min(2 × players, 6)` steps long, so 3 or 4 players get six steps and meet their
  own chain again at step 3 or 4. Any other value, or 5+ players, is one lap
  (`shared.twice` says which).
- **574 كل واحد يكشف سلسلته.** `shared.chain.ownerId`; `revealNext` / `revealBack`
  are accepted from the current chain's owner (still a player in the room) as well
  as the host (or anyone, with the host away: `requireMoveOn`), and keep their
  `staleTap` on `at`. The owner's phone shows the buttons and «🎤 دي سلسلتك: احكيها»;
  the rest see «🎤 سارة بيحكي سلسلته» (or the host's buttons). The TV's pill was
  already «سلسلة سارة»; it has a 🎤 now.

Tests: `rules.mjs` (each number), `leaks.mjs` (the close-guess rule), `play-all.mjs`
core (the close guess hidden from the others, the quick hit's score, «قول الفئة» on
every phone).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
- 6 Oct 2026 (the audit): «لعبة أخرى» in the middle of a round of ارسم وخمّن or الفنان المزيف banks the running scores on the night (`NIGHT_BOARD_FROM_SCORES`), not everyone level.
