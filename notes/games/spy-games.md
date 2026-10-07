# الجاسوس, الحرباء and الموقع السري in rooms

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**الجاسوس in rooms** ends in a vote, like the Chameleon and Spyfall rooms:
after the discussion the host opens it (`startVote`), nobody can accuse
themselves, a tie lets the spy escape, and an accused spy picks the word from
six (`shared.options`, the secret among five others of the same category).

**الجاسوس in English** (the owner, 26 Sep 2026). `SpyWords.js` also holds
`SPY_WORDS_EN` (the same eleven categories under English names - Animals,
Food, Jobs, Places, Things, Brands, Famous people, Transport, Sports,
Countries & cities, Musical instruments - about as many words each as the
Arabic) and `SPY_PAIRS_EN` (المختلف's pairs: 74, then 231 in each language
since the review of 1 Oct 2026 - animals, food, jobs, places, things, sports,
transport, countries, instruments and days out, the same pair on the same line in
both lists). The builds put them in the
page (`SERVER_DATA.spyDataEn` / `spyPairsEn`, `window.SPY_WORDS_EN` /
`SPY_PAIRS_EN`), and the page asks `spyCategories()` and `spyPairs()` in
`JS_Core.html`, which answer in `contentLang()`: the one-phone setup, the room
lobby's categories and كلمة واحدة's room words. The server finds a category in
either list by its name (`spyWords`; the validator refuses an English name
that is also an Arabic one), and المختلف's start carries `lang` for the pairs
(memory key `imppair_en`). Nothing reads `SPY_CATEGORIES` or `SPY_PAIRS`
directly for dealing any more; the Arabic lists and everything else built on
them (ربع قرد, the Stop dictionary, the letter wheel) are unchanged.
Caught and wrong, a point to every player; escaped or guessed, two to each spy.
`revealResult` is the host's way out without a vote and scores nothing. The
word is dealt through `nextPrompt`, and `restart` keeps the scores in
`room._impScores`. **من أنا؟ in rooms** has `gotIt`: the first to press
scores 3, the second 2, the rest 1 (`WHOAMI_ORDER_POINTS`), and the round
reveals itself once everyone present has pressed.

**الحرباء, الموقع السري and القنبلة in rooms** (`chameleonRoomAction`,
`spyfallRoomAction`, `bombRoomAction`). The chameleon's board is public; each
player's secret slice carries the index of the secret word, the chameleon's
carries only its role, and the word reaches `shared` only with the result.
The spy's slice is just `role: 'spy'`; everyone else's holds the place and a
job, and `shared.locations` is a card of 24 places with the real one among
them (`SPYFALL_CARD`), so the spy has something to guess from. Both vote
through the voting engine with `ownerId` set on every option, so nobody can
accuse themselves; a tie lets the impostor slip away, and an accused
impostor gets one guess (`guess` / `spyGuess`, `skipGuess` for the host). The
spy may also `spyGuess` at any time during `play`. The Spyfall clock is a
server deadline that opens the vote by itself. The bomb's fuse is
`room._bombEndsAt`, never projected: phones get `shared.heat` (0-3), bumped by
the alarm at 40%, 65% and 85% of the fuse, and tick faster with it
(`BOMB_TICK_MS`); the bomb itself is on one phone at a time (`shared.holderId`, moved along
`shared.order` by the holder's `pass`), so when the alarm sets it off the
server strikes the holder itself (`explodeBomb`); `markLoser` lets the host
move that strike, and the loser starts the next round. Only the holder's
phone and the TV tick out loud. The strikes are the board, fewest first. `swap` deals a
new category, so it is in `DEAL_ACTIONS` in `room.js`. The three phone
renderers carry their own `TV_GAMES` entries (`JS_RoomChameleon.html`,
`JS_RoomSpyfall.html`, `JS_RoomBomb.html`).

## Every phone looks the same (the audit of 1 Oct 2026)

Phones lie on the table for the whole round, so nothing on one phone may say
"spy" from across the room; only the words, read up close, differ.

- **الجاسوس**: the room card (`.room-role`) is the game's colour for every
  role. `role-card--spy` (red) is no longer used there, and the spy's card
  shows ❓ where a word would be, as الموقع السري's does, instead of the big
  drawn spy.
- **الحرباء**: the grid has no lit cell on any phone during the clues and the
  vote (the secret cell used to be lit on everyone's board but the
  chameleon's); the role card names the word. After a catch the grid lights it
  again, since the chameleon is known.
- **الموقع السري**: the spy's way to guess during play is one quiet
  «🕵️ أنا الجاسوس» (ghost, small) on every phone in the round, as on one
  phone; a non-spy's tap only says it is the spy's button
  (`spy_guess_only_spy`) and changes nothing. A red button on the spy's phone
  alone named the spy. Kept as a button rather than a hidden gesture so the
  spy can still find it under the clock.
- **الجاسوس's discussion clock** is painted first and kept only while it runs
  (`roomDiscussClock.isRunning()`): coming back to the room from the menu used
  to leave it at 00:00.

**On one phone, a caught spy's guess is kept** (the audit of 1 Oct 2026). الموقع
السري saves `spyfallState.caught` when the table accuses the real spy: the accuse
button (and «أنا الجاسوس») takes the back-closed guess sheet back up, and a reload
comes back to it with no clock. A saved `left` of 0 is a round whose time ran out:
a reload reopens the vote instead of a full clock (a new deal saves `null`).
الحرباء keeps `chameleonState.guessing` the same way, so a reload during the caught
chameleon's last guess comes back to the clickable grid, not the accuse bar.
الجاسوس remembers the deal's language (`im.lang`) for the caught spy's six words,
and its category list escapes the «كلماتنا» / crew titles it shows (a 🔒 asks a
password only for the app's own lists).


## الجاسوس / المختلف in rooms: who asks first, a limit, the vote as bars (the review of 1 Oct 2026)

- **A first asker**: `imposterPickFirst` draws `shared.firstId` from the round's
  roster at `start`, anyone, the spy as likely as the rest (as الموقع السري's
  `firstId`). The reveal and the discussion show «🎤 يبدأ الأسئلة: X»
  (`imposterFirstHtml`, `spy_first`) on every phone and on the TV. If that person
  leaves before the vote, `roomPlayerLeft` draws again from whoever is still here.
- **An optional discussion limit**: the lobby's «حد للنقاش» (`imp_limit`) is من غير
  / 3 / 5 / 8 minutes (`IMPOSTER_LIMITS`, `IMPOSTER_ROOM_LIMITS`; remembered in
  `ashryImposterRoomOpts.limit`), off by default. `start` keeps it in
  `shared.limit` (anything else, or an older phone's missing field, is 0);
  `beginDiscussion` sets `shared.endsAt`; `gameDeadline` gives it
  `IMPOSTER_GRACE_MS` and `gameTimeout` opens the vote (`openImposterVote`, which
  `startVote` uses too and which clears `endsAt`). The phone and TV clock count
  down to it («فاضل على التصويت», red under 30 s, `countdownUrgency`, the alarm at
  0) instead of counting up; without a limit it counts up as before.
- **The vote as bars, before the reveal**, in الجاسوس / المختلف, الحرباء and الموقع
  السري, on the phone and the TV: `roomSpyVoteBars(state, ids, where)`
  (JS_RoomVoting.html) draws the closed vote through `renderVoteResults` keyed on
  the deal, with the impostor's own bar (`highlightIds`: `shared.spyIds`,
  `chameleonId`, or the caught one in the guess phase) rising last, lit and tagged
  🕵️ / 🎭 / 🦎 (`tag`, fading in with the light, `.result-row__tag`). It returns
  when that bar starts, and the result card waits for it: `spyRevealParts(key,
  label, after)` holds the turn back (`--cover-at` on the card, `Style*.html` section
  14) and `spyCastHtml(..., { after })` holds the living spy (a positive
  `--spc-late`). The guess phase of a caught spy / chameleon gets the same bars
  and a face-down «الجاسوس كان…» card; the result then shows the bars settled
  (the same key). The TV's result line sits under a cover too (`.tv-spy-reveal`),
  and its confetti waits through `afterReveal`. No vote (the host's reveal, a
  spy's guess during play, someone leaving) draws no bars.

**كلمة واحدة and من أنا؟ in rooms, the review of 1 Oct 2026.** كلمة واحدة's guesser
walks a shuffled order (`roomTurnStep`, `shared.turnOrder` / `turnAt`, as ارسم وخمّن's
drawer) instead of `round % players`. Both deal through `nextPrompts` now (their
`start` / `nextRound` are `DEAL_ACTIONS`): كلمة واحدة's word under `justone_<lang>`
(the host's list) or `justone_spy`, من أنا؟'s characters under
`whoami_<lang>_<category>` - the phone sends `cat` and `lang` with the words (both
optional; an older phone's list is keyed on its length).

## The ideas of 7 Oct 2026 (the owner's picks): built

- **501 الجاسوس «صوتك بيتحسب»** (rooms only; one phone keeps a point to every player).
  On a catch, only the citizens who voted for a spy score 1; anyone who accused an
  innocent gets nothing that round. `finishImposter` (`RoomImposter.js`) reads
  `room._ballots` when a vote closed this round (`shared.vote.phase === 'results'`)
  and publishes `shared.pointIds`; a catch with no vote (a missed «أنا الجاسوس», 502)
  scores every player, as before. The result card (phone and TV) says who scored
  (`imposterPointsLine`, `imp_points_to`). This replaces «Caught and wrong, a point to
  every player» above for rooms. Applies to المختلف too (its catch is a vote).
- **502 الجاسوس «أنا الجاسوس» in the discussion** (rooms, not المختلف). One quiet ghost
  button «🕵️ أنا الجاسوس» on every phone in the round during `discuss`
  (`imposterClaimHtml`, `imposterClaim`); a non-spy's tap only says it is the spy's
  button (`imp_claim_only_spy`), a spy confirms and sends `spyClaim`. The server
  (`spyClaim`: phase `discuss`, a spy only) opens the guess from six
  (`imposterOpenGuess`, shared with a vote's catch) with `shared.claim: true` and clears
  the limit's clock. Right: outcome `claimed`, 3 points to that spy, the round ends
  (`imp_claimed`; the living spy plays it as a steal). Wrong: `caught`, every player
  scores (no vote decided it). The host's skip and the spy leaving are a catch, as
  before. Chosen: the button is in `discuss` only (not on the card-reveal step).
- **503 الجاسوس «مين يسأل مين؟» in rooms**: the lobby switch (`room-imp-director`,
  remembered in `ashryImposterRoomOpts.director`, on by default) sends
  `director: true`; the server keeps `shared.director` (an older phone sends none and
  gets none) and at `beginDiscussion` starts `shared.dir = { turn, askerId, targetId,
  asked, targeted }`: the first asker is `shared.firstId`, then `imposterDirNext` walks
  the one-phone `random` mode (the asker is whoever has asked least, not the last asker
  from three people; the target whoever has been asked least, never the asker). Every
  phone and the TV draw «حسن يسأل منى» in the one-phone `.director` card
  (`imposterDirHtml`, in place of «يبدأ الأسئلة»); `dirNext { turn }` is the asker's
  «التالي», or the host's (anyone's once the host is away, a ghost button), and a stale
  turn does nothing. Someone leaving mid-pair: the host's «التالي» draws again from who
  is here.
- **511 الحرباء, the board shuffled every deal**: the room's `start` / `nextRound`
  shuffles the sixteen words (`shuffled`), and the one-phone deal shuffles them before
  the coordinates are drawn (`startChameleonGame`), so «A1» is not the same word when a
  category comes back.
- **512 الحرباء «الإعادة» on a tie** (rooms; the one-phone accusation is one pick, it
  can't tie): the first tie (`resolveChameleonVote`) goes to `shared.phase = 'tiebreak'`
  with `shared.tied` (the first vote's bars shown, nobody lit); each of the tied says one
  more word, then the host's (move-on) «صوّتوا تاني» (`revote`) opens a vote between the
  tied only, everyone voting (`shared.revote`). A second tie lets the chameleon escape
  (today's rule). A tied player who left is off the replay's ballot; one left is named
  outright (`chameleonAccuse`). This replaces «a tie lets the impostor slip away» for
  الحرباء's first tie.
- **513 الحرباء «مين فضحها؟»** (rooms and one phone): a stolen word leaves the result
  with `shared.blamePending`; the chameleon's phone has chips of the others and «محدش»
  (`chameleonBlameHtml`), everyone else a waiting line and, for the host, a «محدش» to
  move on. `blame { id }` (the chameleon only; the move-on side may only pass nobody):
  the named player -1, `shared.blamedId` / `blamedName`, and «🫢 فضحتها» after their
  name on the board for the round (`chameleonBoardHtml`, the phone and the TV). One
  phone: the result sheet's «مين فضحها؟» chips (`paintChameleonBlame`,
  `chameleonBlame`): another name moves the point, the same name takes it back
  (`chameleonState.blamed`).

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **520 الموقع السري «جرأة الجاسوس»** (rooms and one phone). A spy who guesses the place while
  nobody has accused them (the room's `play` phase; on one phone «أنا الجاسوس» before any
  accusation) scores **3** if right; a caught spy who then guesses right gets only **1**; escaping
  stays 2; a wrong guess is still a point to every agent. Rooms: `spyGuess` stamps `shared.bold`
  (the phase it came in), `finishSpyfall` scores `SPYFALL_STOLE_BOLD` / `SPYFALL_STOLE_CAUGHT` /
  `SPYFALL_ESCAPED` and publishes `shared.spyPts`; the result card (phone and TV) says which
  (`spyfallPtsLine`, `spy_pts_bold` / `spy_pts_late`). One phone: `spySubmitLocationGuess` reads
  `spyfallState.caught` and passes the points to `finishSpyfallGame(…, spyPts)`. Chosen while
  building: with two spies each spy scores the same (as escaping already did). This replaces
  «escaped or guessed, two to each spy» above. Help rule updated; rules tests in `rules.mjs`.
- **525 الموقع السري: the spy's guess mode looks different** (rooms; one phone already guesses in
  its own sheet). On the spy's phone only, «🕵️ أنا الجاسوس» turns the places card into
  `.card.spy-guess-card` (a `--danger` edge and ring, `Style_Party.html` next to `.spy-place`), the
  eyebrow goes `tx-danger`, a hint says a tap is the final guess and what it is worth
  (`spy_bold_hint`), and «✕ إلغاء» is pinned in a sticky `.view-actions.spy-guess-bar` instead of
  the ghost toggle in the stack. Every other phone's button and card stay exactly as before.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **506 «قرعة أعدل للجاسوس»** (no rule asked; built as described). Whoever was the spy (or المختلف) last round is half as likely to be dealt it again; never impossible. One spy at a time by weight: a last-round spy weighs 0.5, everyone else 1. Rooms: `imposterPickSpies(ids, count, room._impSpies)` in `RoomImposter.js` (the last deal's `room._impSpies`, read before it is replaced). One phone: `imp1PickSpies(names, count, lastSpies)` in `JS_Imposter.html` (`finalizeImposterGame`, last round's spies read from `appState.imposter.players`). Help says it. Test: `rules.mjs` (2000 deals with `a` last round's spy: about 14% against 29% each for the rest).
- **507 «اكشف كارتك وأنت دايس»** (the owner picked it knowing it touches «Every phone looks the same»; it keeps it: one card for every role). Rooms: the reveal card is a `.hold-card.hold-card--poster` like مافيا's (the drawn spy icon, «دوس مطوّل عشان تشوف دورك»), its back the same poster as before (`imposterRoleBackHtml`: «🕵️ أنت الجاسوس» / the word / المختلف's word). Nothing shows unless held, and it can be checked again at any time. On the discussion and the vote, a small «👁️ كلمتي» hold chip (`imposterPeekHtml`, `.imp-peek`, `spy.text.js` `imp_peek`) shows the word (or «🕵️ أنت الجاسوس») while pressed - the same chip on every phone in the round. The tap-to-open card and its `imposterCardOpen` / `imposterFlipCard` are gone (and the `tap_to_reveal` key with them). Styles: `Style_Arcade.html` beside `.room-role`.
- **523 «مين يسأل الأول؟» as a face roulette (الموقع السري)**: the first asker's name spins through everyone in the round (`spinLetter` over the roster's names) and lands on the server's `firstId`, on the phones and the TV (`spyfallFirstSpin(root, state, where)` in `JS_RoomSpyfall.html`, `[data-spy-first]`, `.spy-first__name` in `Style_Party.html`). Once per round on each screen (`motionFirst`), only in the round's first 20 seconds (a phone reloaded later just shows the name), never with motion off. My call: names, not faces (the phones have no face for each player; the TV's faces are colour tiles).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
- 6 Oct 2026 (the audit): the hidden player leaving names them in the result line (`shared.impostorLeftName`); «لعبة جديدة» (restart) after a finished round keeps its board server-side (`room._restartNight`), so going back to the hub from the lobby still banks it on the night (من أنا؟ the same).
