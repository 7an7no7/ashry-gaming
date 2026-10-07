# ربع قرد (id `monkey`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**ربع قرد** (`JS_Monkey.html` on one phone, `monkeyRoomAction` and
`JS_RoomMonkey.html` in rooms) referees with `MonkeyWords.js`: countries and
cities in both languages, English animals and foods, and the spy words for
Arabic animals and foods (`monkeyPool`). `monkeyFold` keeps the letters only
(hamza forms, ة/ه, ى/ي, spaces and punctuation go; the article stays, since
الجزائر is spelt with it). Three modes: `letters` spells a name one letter a
turn - a prefix that equals a name (`monkeyExact`) is closed and costs its
closer a quarter; `liar` checks the prefix against the list
(`monkeyPrefixWords`): nothing starts like that and the bluffer pays,
something does and the caller pays and sees three examples; the table can
`flip` the verdict. `chain` and `names` take one real, unused name a turn,
the chain requiring the last letter of the name before. Four quarters make
a monkey, skipped in the order and unable to act, and the host's `swap`
puts them back in someone's place. A turn clock is a server deadline; with
`autoPenalty` it costs a quarter, otherwise it only flags `timedOut` for the
host. One-phone Monkey keeps its old helpers in `JS_Utils.html` (the reorder,
the switch, mid-game players, the status edit, the timeout sheet).

**The living monkey** (27 Sep 2026, المشنقة's cast, section 44 of `Style_Living.html`)
replaced ◔ ◑ ◕ 🐵. `mkFigSvg(q, { mini, tv, moment })` in `JS_Monkey.html` draws a
player's quarters as a flat cartoon monkey that builds itself: 1 the tail, 2 the
body with the belly and the legs, 3 the arms, 4 the head with its big ears. The
pieces still to come are a faint dashed outline (`.mk-ghost`; a silhouette on the
small figures), and the head's face is on that outline from the start - cheeky
(a tongue out, one brow up) while there is hope, worried with a sweat drop at three
quarters, a grin once whole. Decided here: the owner's order puts the head last, so
the face lives on its ghost until then. `mkMoments(scope, quarters, onNew)` keeps
each player's last quarters per game (one phone: `m.deal`, set at start; a room:
`roomDealKey`) and returns a moment for a quarter given (the piece pops in from its
joint, `.is-new`) or taken back by a swap or an undo (it pops out over its ghost,
`.is-lost`), with `--mk-late` so a redraw carries on; the first sight plays nothing.
Loops: the tail twitches, the body rocks; big at three quarters it scratches where
its head will be, hangs from the branch by one arm and throws a banana peel that
lands beside it (one 12 s loop); whole it beats its chest and jumps, and the moment
it becomes a monkey (`.is-became`) two big jumps and a drum roll on the chest with
«أنا قرد خلاص!». A small whole monkey sleeps, grey (`.is-asleep`, Zzz). The speech
bubble (`mk_bub_1..4`) is on big figures only. Where: a mini on every row (one phone,
a room) and TV chip, with «أنا قرد خلاص!» (`mk_row_monkey`) on a monkey's row (on the
TV only for the moment it happens); big beside the verdict (the loser's), in a
monkey's own «إنت القرد» note, and on the TV (the verdict's loser, else the player
up). Sounds `FX.mkBoing`, `mkChest`, `mkSlide` (registered in `JS_RoomMonkey.html`,
which loads after `JS_Sounds.html`): one phone plays them; in a room the loser's
phone (a buzz always, the sound when there is no TV) and the TV.

## The room phone's screen (1 Oct 2026, the before/after sheet)

On the phone whose turn it is, the Arabic letters are one grid of 11 columns
(`.mk-keypad--grid`, 32 letters as 11, 11, 10; `MONKEY_KEYS.ar` joined), so the
keyboard fits its card from 320px to 430px and on a phone on its side (keys 44px
tall, 40 sideways; `.mk-keypad--room`, the one-phone keypad is untouched). English
keeps its three QWERTY rows. «حالة اللاعبين» is one strip of player chips under the
head (`mkBoardHtml` → `roomPersonChip`, `.mk-person`): whose turn it is lit
(`.is-first`), each chip carrying its state as a small badge (`.mk-person__q`: آمن,
¼ ½ ¾, 🐵 for a monkey, the stage's full name as its title); the host's swap is a
small row under the strip («🐵 تبديل: name», then who takes the place). كذّاب! and
مفيش عندي are the main pair of the bottom bar (`.view-actions.talk__actions.mk-bar`,
`.room-bar__pair`), the host's ↶ تراجع, تخطّي and +¼ وتخطّي small under them
(`.talk__pair`; a non-host's تخطّي while the host is away). In the names and chain
modes مفيش عندي moves to the bar too, and the send button is `btn--send`. The rules,
the verdict, the flip, the moments and the TV are as they were.

**The board carries a score** (the audit of 1 Oct 2026): `monkeyBoard`'s rows have
`score` = the quarters, fewest first, so the room's night, «مين هيكسب؟» and the program
rank ربع قرد by its places like every other game (it used to bank nothing, and the program
gave everyone first place).

**Time's up, waiting on the host** (the review of 1 Oct 2026). With the automatic
quarter off, the server's clock sets `shared.timedOut` and the turn waits for the
host. It is in both signatures now and drawn as a band: «خلص الوقت: ربع قرد ولا
تعدّيه؟» on the host's phone and TV, «خلص الوقت» on the rest. And `flip` clears
`shared.newMonkey` when the quarter it takes back was the one that made the monkey.

One phone: «بدّل» pauses the turn clock and a cancelled swap gives it back
(`monkeySwapClosed`); a reload mid-turn starts the turn's clock again with its full
time (the audit of 6 Oct 2026).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
