# الكراسي الموسيقية (id `chairs`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **الكراسي الموسيقية (Musical chairs)** - the owner's idea of 27 Sep 2026
  ("each phone in a room, fastest to click sit when the music is off"),
  every rule picked from a list (*الكراسي الموسيقية*):
  - **Rooms and the TV only, 3 to 12 players; latecomers watch** until the
    next game. **Chairs = players − 1, one out a round** until one is left.
  - **The music plays on the TV, or the host's phone when there is none;
    every phone buzzes and flashes at the stop.** An Egyptian beat made with
    Web Audio (maqsum on a darbuka, a riff in hijaz), **its tempo climbing**.
  - **A false start** (a tap while the music plays) **puts that player out at
    once**, and the round ends.
  - **Fake stops: a lobby switch, off by default** («وقفات خداعية»): the
    music pauses for a moment and goes on; a tap in the pause is a false start.
  - **The music plays a random 5-20 s**, no choice.
  - **No tap within 3 s of the stop = last, so out**; no host button needed.
  - **Scoring: a wins tally across play again, and the places at the end**
    (the winner, then the last out first).
  - **Home: the party section, a drawn chair icon** (`art:chairs`).
  - **Look أ «الصالة»** from a design sheet of three
    (https://claude.ai/artifact/LsYSF3NPhCppEe3b6b3Zvm): the arcade violet
    ground, wooden chairs on a pale rug, round avatars with initials, the
    amber «اقعد!». The owner added mid-build: **animations everywhere in it**.
  - Decided here (open to change, each one place in the code):
    - **The stop moment is a server secret** (`room._chairs`, like the bomb's
      fuse), and so are the fake pauses until they come.
    - **Fair on the network**: a tap carries `at`, the phone's stamp of the
      server's time (`serverNow` / `receivedAt`, the chess clocks' gap), and
      the server keeps it only inside the window it can prove - not before the
      stop, not after the arrival; a stamp outside it counts as its arrival
      (`CHAIRS_GRACE_MS` of drift allowed). So a slow connection loses no
      chair and a phone can't claim a time it never saw. No stamp counts
      under `CHAIRS_MIN_REACT_MS` (120 ms) after the stop - `stopAt` is on
      every phone, so a changed page sent it and always sat first - and taps
      held to that floor go by arrival (the audit of 1 Oct 2026).
    - **The board is the roster's**: the wins tally for the people dealt in
      (a phone that joined to watch isn't on it), level wins told apart by the
      last game's places (`tie`, `boardRowKey`). So the night and the program
      rank one game by the order out (5 / 3 / 2 / 1), not everyone after the
      winner tied for second.
    - **The next round starts by itself 5.5 s after the result**
      (`CHAIRS_BETWEEN_MS`); the host can start it sooner. The game flows
      like the real one, and there is nothing to read on the result.
    - A win counts only against somebody (a game where everyone else left is
      nobody's: `s.left`); a player who leaves is out of the ring; fewer than
      two ends the game. Leaving while the chairs are being taken makes the
      leaver that round's one out («ساب الغرفة», `why: 'left'`), so nobody
      else loses a chair for it (the audit of 28 Sep 2026).
    - Someone who is out gets the audience bar and watches the ring.

### الكراسي الموسيقية

The owner's rules are in *The owner's specs*. Game id `chairs` everywhere
(`room-chairs`, `ROOM_GAMES.chairs`, `TV_GAMES.chairs`, the catalog, the
help); the rules are named `chairs` / `CHAIRS_`, the page's code `mch` / `MCH_`.

- **`RoomChairs.js`**: `shared` holds `settings { fake }`, `roster` (the
  first twelve people), `alive`, `outOrder`, `order` (the avatars' order
  round the ring, drawn each round), `round`, `chairs`, `phase` ('music' |
  'sit' | 'result' | 'gameover'), `startAt`, `pause { at, until }` (a fake
  pause, only while it lasts), `stopAt` (once stopped), `sits` ([{ id, name,
  ms }], ms null for no tap), `loserId` / `loserName` / `why` ('last' |
  'late' | 'early'), `nextAt`, `winnerId`, `places`, `wins`, `board` (the
  wins tally). `room._chairs = { stopAt, fakes, fakeAt }`, never projected.
  Moves: `start` / `playAgain { fake }` (the host), `sit { round, at }` (a
  stale round is dropped; while the music plays it is a false start),
  `nextRound` (the host). The clock (`chairsDeadline` / `chairsTimeout`)
  wakes for a fake pause's start and end, the stop, the window's close and
  the next round.
- **`JS_RoomChairs.html`** (section 50 of `Style_Rooms.html`): `mchRingHtml` draws
  the ring - the rug, the chairs at 31% of the square, the avatars orbiting
  at 43% while the music plays (`.mch-orbit`, a Web Animation whose
  `playbackRate` follows the tempo and is 0 in a fake pause; each avatar
  counter-rotated to stay upright), on their chairs in tap order or standing
  between the chairs' angles once it stopped, the loser greyed and walking
  off (`is-walking`, once per round through `motionFirst`). The avatars
  that moved hop from where they were (`mchFlip`: rects measured before the
  redraw, and every paint tick during the music, so the hop starts from the
  orbit). The middle is the equalizer (bars on Web Animations), «وقفت!» with
  the draining 3-second bar, the result line with the countdown, or the
  winner. The button is one element: grey «استنى…» while the music plays
  (a tap is a real false start), amber «اقعد!» popping in at the stop,
  locked as soon as it is tapped (`mch.pressed`). `mchTapAt` is the stamp
  (`Date.now() − mch.gap`, the smallest `receivedAt − serverNow` seen). The
  music (`mchMusicSync`: a lookahead scheduler on `fxTone` / `fxNoise`,
  `MCH_MAQSUM` and `MCH_RIFF`, the tempo from `mchTempo`) plays only on
  the voice (`mchIsVoice`: the TV, else the host's phone); the stop's
  scratch, a note per seat taken, the out and the win sounds are the
  voice's too; every phone buzzes and the rug flashes at the stop
  (`mchOnce` keys, whatever the motion setting). The TV frame is the ring as
  tall as the stage beside the order (or who is in the ring while the music
  plays, and the places and the wins at the end).
- Tests: `rules.mjs` ("Musical chairs", 31 checks: the secret stop, the
  window, the stamps' clamp, a false start, no tap, the places and the wins,
  leaving, the 13th watching, the fake pauses), `leaks.mjs` (the stop moment
  and the fakes never reach a phone), `play-all.mjs` (`--only=chairs`: a
  false start, taps ranked by their stamps, a quiet phone, the end, play
  again with a latecomer, a leave).

## «الدي جي» - the one out stops the music: built 2 Oct 2026 (the owner's answers of 2 Oct 2026)

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea numbers in brackets) and every rule asked.

- **(248) A player who is out runs the music.** This changes the 27 Sep rule that the stop is a server secret, only while the switch is on (fair because the DJ is already out).
  - **A lobby switch «دي جي من اللي خرج», off by default**: off, the game is exactly as today. Round 1 always uses the secret stop (nobody is out yet).
  - **The latest one out is the DJ**: each round the job passes to whoever just went out.
  - **The DJ has «وقّف» and, if the fake-stops switch is on, «وقفة خداعية».** The stop can't come in the first 4 s of the music; **if the DJ hasn't stopped by 25 s, the server stops it** by itself.
  - **No points for the DJ**; the end shows the title «أحلى دي جي» for whoever caught the most people with a fake stop.

### How it is built

- **`RoomChairs.js`**: `settings { fake, dj }` (the start / play again payload's `dj`, kept across play
  again). `chairsPickDj` at every round start from round 2: the latest one out (`outOrder` read
  backwards) who is still in the room, not a computer player, and not away (`room.lastSeen`);
  nobody - `dj: null` and the secret stop. A DJ round keeps `room._chairs = { stopAt: startAt +
  CHAIRS_DJ_MAX_MS, fakes: [], dj }`: the server deals no fake pauses of its own, and its only stop
  is the 25 s backstop. Shared: `dj`, `djName`, `djLost`, `djFakes` (this round), `djLastFake { at,
  until }`, `trapBy` (who caught this round's false start), `djCaught { id: n }` (this game),
  `bestDj { n, ids, names }` (at the end, or null).
  - `djStop { round }` / `djFake { round }`: only `s.dj` (and `_chairs.dj`), only while the music
    plays, refused quietly before `startAt + CHAIRS_DJ_FIRST_MS` (4 s); a stale round is dropped
    (`staleTap`). The stop is `chairsStop(room, Date.now())` - the press stamped by the server as it
    arrives - and the taps are judged against it exactly as against the secret stop. A fake is the
    same `s.pause` as the server's (`dj: true`), `CHAIRS_FAKE_MS` long.
  - A false start while a DJ's fake pause is on, or up to `CHAIRS_DJ_TRAP_MS` after it ended, is
    that DJ's catch (`trapBy`, `djCaught`).
  - `chairsDjLost` hands a round back to a secret stop (2.5-7 s ahead, never before the 4 s): from
    `chairsPlayerLeft` when the DJ leaves, and from `chairsTimeout` once `room.lastSeen[dj]` is
    `CHAIRS_DJ_AWAY_MS` (3 s) old - `chairsDeadline` wakes for it (room.js schedules the alarm when a
    phone's last socket goes). The pause's end falls through into the rest of the timeout (*a timeout
    does everything due*), since a DJ's fake can end at the backstop.
  - Off, none of this runs: `dj` is null every round and the round is the one of 27 Sep.
- **`JS_RoomChairs.html`**: the lobby's second switch (`mchOpts().dj`, its hint), `mchDjHtml` (the
  DJ's panel in place of the out note: 💿 «إنت الدي جي!», the amber «وقّف» with its line, and «🎭 وقفة
  خداعية · باقي N» with the fake stops on), `mchDj` (one stop a round, a fake locked a beat), and
  `mchDjPaint` on the paint tick (the buttons open at 4 s, «جاهز بعد N…» / «هتقف لوحدها بعد N ث»,
  the fakes left, locked in a pause or the 1.5 s gap). The record turns with the beat on the
  orbit's animations (so it stops dead in a fake). The head carries «🎧 الدي جي: X» while the music
  plays (the TV's eyebrow too, and its list has a 🎧 badge on the DJ's row); a result caught by a
  fake says so («🎧 وقفة X الخداعية وقّعته»); the one out gets «🎧 إنت الدي جي الجولة الجاية»; the
  end has «أحلى دي جي» at the foot of the places card. `mchDjSig` is in both signatures. The words
  are `MCH_DJ_TEXT` in the chunk (read through `mchDjT()`), not TRANSLATIONS: the shell is at its
  710 KB budget (as `SNK_BUBBLES`). `turn_chairs_dj` (JS_RoomTurn.html) is the «دورك!» alert.
- Tests: `rules.mjs` (41 checks «chairs/dj»: off as before, round 1 secret, the DJ, the 4 s, only
  the DJ, the stale round, the server's stamp, the taps, the backstop, the fakes - 4 s, the gap,
  three a round - a catch and the trap window, «أحلى دي جي», play again, the DJ away and gone, who
  is DJ: away, a computer player, nobody); `leaks.mjs` (a DJ round sends no stop moment to any phone,
  the DJ's included; a round taken over keeps its secret stop; the game is played with the switch
  on after the plain one); `play-all.mjs --only=chairs-dj` (a fake that catches, a DJ's phone
  closing and the server taking over, «أحلى دي جي», the DJ's own stop on every phone).

### The TV fits 1920x1080 and 1280x720 with 5-8 people (2 Oct 2026)

With five at 1920x1080 the end's side column was about 1,476 px tall: the wins list and the bottom
of the ring were cut off, and in the music the hint under the ring was clipped. Now (`Style.html`,
the TV block of الكراسي; `TV_GAMES.chairs.frame`, `mchOverHtml(state, s, tv)`):
- `.mch-tv` is one row the stage's height (`grid-template-rows: minmax(0, 1fr)`, `overflow: clip` -
  the orbit's turning corners, empty, used to give the TV a scrollbar); the ring is `min(64vmin,
  100%)`, so the round line, the ring and the hint fit; the side never stretches the row
  (`max-height: 100%`, scrolling only as a last resort).
- **The end on the TV** is the places alone (`.mch-over--tv`, no `tv-scale` zoom): sized in the TV's
  units (`--tv-md`, the winner `--tv-lg`), in two columns from five places (`MCH_TV_PLACES_TWO_COLS`,
  the winner across both), «أحلى دي جي» as its foot. The wins of the evening are not repeated
  there: the TV's strip of players carries them (`tvStrip` reads the board). Phones keep the board.
- **The music and the result** keep the side's list zoomed (`tv-scale`) with compact rows, in two
  columns past six people (`.mch-tv__side.is-many`).
- Checked at 1920x1080 and 1280x720 with 5 and 8 people (scratchpad shots `chairs-*`).

### Decided here (open to change)

- **The TV's end shows no wins board** (the strip under it has the wins); two columns of places from
  five people; the side's lists in two columns past six.
- **Who is DJ when the latest one out can't be**: the one out before them who is here (away phones
  and computer players are skipped); nobody - the secret stop. (`chairsPickDj`)
- **A DJ "goes offline"** when their phone has had no socket for 3 s (`CHAIRS_DJ_AWAY_MS`); the
  server then stops the music at a secret moment 2.5-7 s ahead (`CHAIRS_DJ_TAKEOVER_MS`), and the
  round stays the server's even if the DJ comes back. Phones read «الدي جي مشي… الموسيقى هتقف لوحدها».
- **The DJ's fake stops**: the same 0.6 s pause as the server's, also not in the first 4 s, at most
  three a round (`CHAIRS_DJ_FAKES`), 1.5 s apart (`CHAIRS_DJ_FAKE_GAP_MS`), and none in the last
  1.1 s before the 25 s backstop. With a DJ the server adds no fakes of its own.
- **A catch** is a false start during the DJ's fake or within 0.8 s after it ends
  (`CHAIRS_DJ_TRAP_MS`), counted for this game only; a tie for «أحلى دي جي» names everyone level.
- **Everyone sees who the DJ is** (🎧 in the head, the TV's eyebrow and list) - nothing of when.

- **A late alarm** (the audit of 6 Oct 2026): a fake pause handled after its own end is skipped (its deadline would stay due and rest the room 30 s), and the secret stop is stamped when the server publishes it (`chairsStop(room, now)`), so a late alarm never shortens the 3 s to sit.

## The ideas of 7 Oct 2026 (the owner's picks): built

- **850 B «النهائي»** (the look picked from the design sheet of 7 Oct 2026, sheet7, look ب): when two are
  left with one chair, the ring becomes a stage - red curtains, a floor, one spotlight on the chair in the
  middle, the two big on the left and the right like a boxing final, «VS», «الزفة! النهائي» with 🥁🎺🪘💃 -
  and the voice plays a zaffa instead of the maqsum. At the end the moment is replayed slowed down: two
  lanes, a dashed finish line through the chair, each running to it at their own tap time, the clocks
  counting, the winner hopping onto the chair with the crown, and «الفرق 0.076 ثانية» below.
  - Client only (`JS_RoomChairs.html`); no rule changed. `mchIsFinal(s)` (`s.chairs === 1` and two in
    `s.order`) makes `mchRingHtml` hand over to `mchFinalHtml(state, s, o)`, on the phone (a 4:3 stage)
    and on the TV. While the two play the TV frame is the stage alone (`.mch-tv.is-final`, no side); at
    the end the side keeps the places (`.is-final-over`, the stage two thirds).
  - Positions are percentages of the stage, sizes in `cqw` (`container-type: inline-size`, the width on the
    stage itself). `order[0]` stands on the left, `order[1]` on the right (a stage, physical sides, `dir="ltr"`).
  - Music: the avatars and the instruments bounce on the beat (Web Animations pushed on `mch.eq`, so the
    tempo and a fake pause hold them, as the orbit). The stop: the one who sat hops onto the chair (the
    existing `mchFlip`, `data-mch-av`), the cone flickers (`is-flash`).
  - The replay (`mchFinalAfter`): the stage drawn at its end, played once (`motionFirst('mch-replay|deal|round')`),
    nothing with motion off. Each runner from its lane's start to the line in `ms × k` (k = 4, or less
    so the slower one takes at most 4.2 s: `MCH_REPLAY_SLOW`, `MCH_REPLAY_MAX_MS`); the clocks count in
    that slowed time (rAF); the crown, the gap, the loser greyed and the winner's ring come by a timer
    (`is-replay` taken off), never by an animation's end. A false start, a leave or no time: no replay,
    the winner on the chair and «قعد بدري» / «—».
  - The zaffa (`mchPlayZaffa`, `MCH_ZAFFA`, `MCH_ZAFFA_RIFF`): a 16-step zaffa on the tabl, the riq's
    jingles on every step, a mizmar line in hijaz (sawtooth and square on `fxTone` / `fxNoise`), on the
    same lookahead scheduler and the same voice (`mchMusicSync`, `m.final`).
  - Its styles are `MCH_FIN_CSS` in the chunk (put into the page once, `mchFinalStyleOn`), not Style_Rooms.
    The stage's own colours (curtain, floor, light, chair) are fixed: the stage is always dark, like a TV
    stage, in both themes.
  - Words: `mch_final`, `mch_zaffa`, `mch_replay`, `mch_gap`, `mch_secs` (chairs.text.js); the rules got a
    line about the final.
  - Decided here: the stage on the phones too (the sheet drew the TV); no zaghrouta (the owner's rule of 28
    Sep stands); the replay's slow factor ×4 capped at 4.2 s.
  - Shots: `scratchpad/sheet7/built/850-*.png` (1280x720 music, replay, end; 1920x1080 end; phone 375 music
    and end in English, light).

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **854 «الأرقام القياسية»** (no extra rule asked). The room keeps its fastest sit of the evening and slams
  «🏆 رقم جديد للأوضة!» with the name when it is beaten.
  - Server (`RoomChairs.js`): `chairsNoteRecord` (when a round's sits close, `chairsCloseSit`) compares the
    round's quickest sit with `room._chairsBest` (like الحقوا!'s `_wireBest`, kept by the room across play again
    and new games from the hub); `shared.best` `{ ms, id, name }` is the record, `shared.record` `{ ms, id, name,
    was, wasName }` is set on the round that broke it (cleared by the next round). A false start's round has no
    sits and counts nothing.
  - Chosen: the evening's very first sit sets the record quietly (a slam on everyone's first round would mean
    nothing); afterwards only a strictly faster sit is a record.
  - Page (`JS_RoomChairs.html`): `mchRecordHtml` at the top of «مين قعد الأول؟» (the stamp slams once,
    `motionFirst`), `mchBestLineHtml` at its foot («⏱️ رقم الأوضة: … · … ms»), phone and TV; the voice plays the
    success sound and the holder's phone buzzes (`mchAfter`); `mchRecSig` in both signatures. Styles in
    `MCH_FIN_CSS` (the chunk's own); words `mch_rec_*`; a line in the rules.
  - Tests: `rules.mjs` («chairs record»: quiet first, broken with the name and the old time, no record for a
    slower sit, kept by play again and by a new game from the hub).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
