# الشاهد (id `witness`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

  - **الشاهد** (the witness), **its own card**, with خمّن مين's faces: the
    witness sees a face 8 s, the sketch artist builds it on a face builder
    from what the witness says; the table then votes on a lineup. **The
    witness describes in their own words** (no yes/no limit). **8 seconds,
    6 faces in the lineup**, very alike. **The jury hears the witness too**
    (all in one room; the difficulty is memory and a close lineup). **90 s
    to draw, the artist can finish early.** **Points: the jury a point for
    right, the witness and the artist a point for each juror right.** **One
    round each as witness** (the artist the next in turn). **3-12 players,
    no TV needed.** The crime is a family joke (who ate the last kunafa).
    **The look: أ «القسم»** (the owner, 29 Sep 2026, from
    https://claude.ai/artifact/7NmAM8cFDs2ubDVmCDd49n): the police station -
    the artist's builder with category tabs and big option buttons, the
    witness's case file with a Polaroid and a countdown ring, the TV's
    lineup against a height-line wall, votes landing as initialled coins
    under each suspect, a spotlight and «هو ده!» on the real one.
    **Built 29 Sep 2026** (*الشاهد*); decided while building (open to
    change, each in one place):
    - **The witness taps «وريني الوش» first** (a `ready` step): the 8 s
      start when they are looking, not while the phone is in a pocket, and
      count from the face's arrival (0.4 s of network lead,
      `WITNESS_LOOK_LEAD_MS`). A witness who never taps (a locked phone) is
      passed over by the host's (or a stand-in's) «عدّي الشاهد ده»; their
      round is skipped, not replayed.
    - **The lineup is one gender** (a family would rule out the other half
      at a glance), every suspect a different name, each look-alike 1-3
      features off the real face (`WITNESS_CHANGES`: the hair and its
      colour, eyes, brows, glasses, a beard or moustache, the mouth, marks,
      earrings and the rest, the clothes), never adding or taking away a
      hijab, and no two with the same `gwSignature`.
    - **Every face is a look-alike of a hidden one** (the audit of 1 Oct
      2026): the six are 1-3 changes each of a face nobody sees, and the real
      one is any of them at random. When the five were changes of the real
      face, it was the centre of the six (the value most faces share in
      nearly every feature) and "pick the middle face" found it in 98% of
      lineups without the witness; now 1 in 6 (`rules.mjs` measures it).
    - **The sketch starts as a plain man** with nothing on (`witnessBlank`);
      the artist's first category is man or woman. Every pick is sent to
      the room (a `sketch` move, only a newer one kept), so the witness and
      the jury watch the words take shape.
    - **The jury is everyone but the witness and the artist**, the vote on
      the voting engine: secret until it closes, changeable until then,
      closed when every juror has voted, on a 45 s clock
      (`WITNESS_VOTE_MS`) or by the host. A round with no juror left goes
      straight to the reveal.
    - **24 family crimes** (`wit_crime_0..23`, `WITNESS_CRIMES`: the kunafa,
      the stuffed vine leaves, the remote, the basbousa, the last mango, the
      molokhia, the slippers, the charger…; 8 until the review of 1 Oct 2026),
      one a round, dealt at the game's start through the shared prompt memory
      (`nextPrompts`, key `witness_crimes`): none twice in a game, and none
      back until all have been dealt.
    - **🤐 The witness is silent during the vote** (the review of 1 Oct 2026:
      they could just name the suspect): their phone shows «🤐 الشاهد ساكت
      دلوقتي · ولا كلمة لحد ما التصويت يقفل» big over the lineup, the TV
      shows «🤐 الشاهد ساكت دلوقتي» beside the votes (`.wit-hush`), and the
      rules say it. A table rule, not enforced.
    - **The next case is the host's tap** after the reveal (a pause the table
      uses to laugh at the sketch); anyone once the host is away.
    - **Leaving**: an artist who leaves before drawing hands it to the next
      in turn; mid-drawing, the vote opens on what is drawn so far; a witness
      who leaves before the drawing starts has their round skipped; fewer
      than three at a round's start ends the game. A latecomer watches and
      plays the next game.
    - **The TV is the room's one voice** (the shutter, the file closing, the
      clock's last seconds, the coins, the stamp, the win); with no TV the
      host's phone.

### الشاهد

The owner's rules are in *The owner's specs* (the five new room games). Game
id `witness` everywhere (`room-witness`, `ROOM_GAMES.witness`,
`TV_GAMES.witness`, the catalog, the help); the rules are named `witness` /
`WITNESS_`, the page's code `wit` / `WIT_`, the stylesheet section 56
(`.wit-*`). Rooms only, 3-12 people, no computer players, the TV optional.

- **`Witness.js`** (shared, no DOM, after `GuessWho.js`, whose faces it
  uses): `witnessBlank(g)` the sketch to start from, `witnessClean(raw)` any
  sketch a phone sends made legal (every field one of its choices, then
  `witnessFix`: what a hijab hides goes, a cap never on a bald head or a bun,
  glasses or sunglasses, a tie only on a collar, a hijab, cap or scarf never
  the shirt's colour), `witnessLineup(rnd)` → `{ faces, real }`: a real face
  (`gwRandomFace`) and five `witnessAlike` copies, each one to three
  `WITNESS_CHANGES` away, one gender, distinct `gwSignature` and names.
- **`RoomWitness.js`** (bundled last): `shared` holds `roster`, `order` (the
  witnesses in turn, shuffled), `turn`, `round`, `rounds` (one each),
  `crimes` / `crime`, `phase` ('ready' → 'look' → 'draw' → 'vote' → 'reveal'
  → … → 'gameover'), `witnessId`, `artistId`, `lookEndsAt`, `drawEndsAt`,
  `sketch` and `sketchN`, `lineup` (published at the vote, `realIdx` only at
  the reveal), `jury`, `voteEndsAt`, `picks` (each juror's pick, published at
  the reveal), `right`, `gained`, `scores`, `history`, `skipped` and `board`.
  `room._witness = { lineup, real }`, never projected; the witness's slice is
  `{ face }` during the look only. Moves: `start` / `playAgain` (the host),
  `ready`, `sketch { round, n, face }`, `done { round, face }`, `vote {
  round, option }` ('s1'..'s6'), and the move-on actions `closeDraw`,
  `closeVote`, `skipTurn` (a quiet witness), `nextRound`; each carries
  `round` (`staleTap`). Points at the reveal: a juror right +1, the witness
  and the artist +1 each for every juror right.
- **`JS_RoomWitness.html`** (look أ «القسم»): the police-station head (the
  station, the case count, the clock), the roles as chips, the manila case
  file (`witFolderHtml`: the crime, a Polaroid of the face on the witness's
  phone only, the countdown ring `witRingHtml` painted from the server's time,
  then the Polaroid turning over), the mugshot against height lines
  (`witMugHtml`, the sketch with «المشتبه فيه · رسم …»), **the builder**
  (`WIT_CATS`, `witBuilderHtml`: category tabs - man or woman, skin, hair and
  its colour, a cap or hijab, glasses, eyes, brows, a beard, the mouth,
  marks, extras, a scarf, the top, a tie, the shirt's colour and pattern -
  and big option buttons; a pick redraws the mugshot in place and sends the
  sketch, `witPick`), the lineup (`witLineupHtml`: six suspects against the
  height wall, numbered plates, a tap votes on a juror's phone, the coins
  with each juror's initial landing under the suspects at the reveal, a
  spotlight and the «هو ده!» stamp on the real one), the sketch beside the
  real face (`witCompareHtml`), the verdict and the points gained, and the
  podium at the end. The artist's phone is the builder; the witness's the
  case file, then the sketch growing and the hint chips («الشعر؟»…); the
  jury watch the sketch. The TV draws the case file and the sketch big, then
  the lineup, the coins and the spotlight. `roomTurnOf` asks the witness to
  tap and the artist to draw.
- **Motion**: the Polaroid flips, the lineup rises one suspect at a time,
  the coins drop one by one, the spotlight comes on and the stamp slams, the
  points count up; the sounds (`witSound`: a shutter, the file closing, the
  last seconds' ticks, the coins, the stamp) on the room's one voice
  (`witVoice`). A reload, a latecomer or a TV coming on replays nothing
  (`motionFirst`, `witOnce` keyed on the round; `witFirstSight` marks the
  phase already on the table as seen the first time the page sees the room).
- **Layout** (section 56): upright one column; a phone on its side and from
  900 px the case file beside the message, the mugshot beside the builder
  (as tall as the play area on a phone's side), the lineup six across, the
  reveal's lineup beside the comparison. The TV: the head, then the stage.
- Tests: `rules.mjs` ("The witness": lineups, the clean, a whole game with
  its points, stale taps, the clocks, leaving in each phase), `leaks.mjs`
  (`PROBES.witness`: the real face on the witness's phone only during the
  look, and the real index, the picks and the face on no phone before the
  reveal - proved by leaking each in a scratch build; `DRIVERS.witness`: five
  people, a skipped round, the clocks, the host's close, a leaver),
  `play-all.mjs` (`--only=witness`: four phones and a TV to the podium, and
  play again).

## «الرسم مطابق 78%»: built 2 Oct 2026 (the owner, 2 Oct 2026)

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea numbers in brackets) and every rule asked.

- **(228) At the reveal the app measures the sketch against the real face.**
  - **Feature by feature, each feature the same weight** (hair, eyes, nose, mouth, beard, glasses… whatever the builder has); the TV ticks ✓ / ✗ beside the two faces while the % counts up (`countUp`).
  - **At 70% or more the witness and the artist each get +1**, on top of their jury points. Under 70% the % is only for the laugh.
  - Always on, rooms and the TV.

**How it is built.** `Witness.js` (shared): `WITNESS_MATCH_LINE` 70, `WITNESS_MATCH_POINTS` 1,
`WITNESS_FEATURES` (the builder's own categories, the page's `WIT_CATS` keys: man/woman, skin,
hair style, hair colour, on the head, glasses, eyes, brows, beard, mouth, marks, extras, scarf,
top, tie, shirt colour, pattern; each a `get` and a `when` it shows) and `witnessMatch(sketch,
real)` → `{ feats: [{ k, ok }], ok, of, pct }`, both faces through `witnessClean` first. The
server works it out in `witnessReveal` (RoomWitness.js) - it alone has the real face before then -
and publishes `shared.match` with the reveal (`null` from a round's start; `blank` and `won` on
it), adding `WITNESS_MATCH_POINTS` to the witness and the artist (and `s.gained`) when `won`.
On the page `witTallyHtml` (JS_RoomWitness.html, `witMatchOf`: `shared.match`, or the same
`witnessMatch` from the two faces for a room on an older server) draws «الرسم مطابق 93%» -
the % counting up (`stageReveal`'s `count`) to land with the last tick, a bar with the 70% line
(`.wit-match__fill` grows by `transform`), «الرسام جاب 14/15» under it - then the ✓ / ✗ chips one
by one, then «🎯 70% وأكتر: +1 للشاهد و+1 للرسام» or «تحت 70%: للضحك بس 😄», on every phone and
beside the two faces on the TV (section «IDEAS BATCH: ROOMS» of `Style_Night.html`, `.wit-match*`; the
TV's reveal column has smaller faces and tighter gaps so it all fits 16:9). The tally of the
ideas batch (`witFeatureMatches`, worked out on the page) is replaced by it. The game's words
are in `WIT_TEXT` in the chunk (all the `wit_*` keys moved out of `TRANSLATIONS`, the shell's
budget). Tests: `rules.mjs` (the real face against itself 100%; one feature off is one tick;
only features that show; the line; an exact sketch wins +1 each; an untouched sketch wins
nothing; no match before the reveal), `leaks.mjs` (`shared.match` before the reveal is a leak -
proved by leaking it), `play-all.mjs --only=witness` (the match measured and the +1 on top of
the jury points).

**Decided here (open to change):**
- **Only features that show on the real face count**: no hair colour under a hijab or on a bald
  head, no hair style under a hijab, no eye colour behind sunglasses, a beard only on a man, the
  scarf and the extras only without a hijab, a tie only on a collar - so a face has 10 to 17
  features (about 15). Man/woman is one feature like any other (the owner: each the same weight),
  so a sketch of the wrong gender can still pass 70%.
- **The marks and the extras are one feature each**, right only when every switch in them matches
  (the builder shows them as one tab each).
- **A sketch the artist never touched** (still the plain man it starts as) is measured for the
  laugh but wins nothing, whatever its % («الرسام ما لمسش الرسمة: من غير نقط»).
- **The witness and the artist get the +1 even if they have left the room** by the reveal, as the
  jury points already were.

- **Weights (the owner, 2 Oct 2026, after the first build)**: man/woman, the hair's style and its colour weigh 2, every other feature 1 (`w` in `WITNESS_FEATURES`, Witness.js); the line stays 70%. At equal weights a sketch with the wrong gender, hair colour and glasses still scored 81%.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
