# المشنقة (id `hangman`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **المشنقة (Hangman)** - the owner's spec of 22 Sep 2026, asked one at a
  time, look ج "نضيف" picked from a sheet of three (*المشنقة*):
  - **Two on one phone** and **rooms**; not solo against the phone. **No
    computer players.**
  - A letter in the word **shows every place it stands**; one that isn't
    draws **a piece of the man** - the owner restated this rule themselves.
    **Six misses, the classic stick man** (chosen over friendlier pictures).
  - **The whole word may be guessed; wrong, it costs a piece.**
  - **In Arabic one key a letter**: ا opens أ إ آ, ه opens ة, ي opens ى; the
    word is always shown as it is spelt. Decided here: ء ؤ ئ ٱ go with ا, و
    and ي the same way. **Both ways** (the owner, 23 Sep 2026): أ finds ا as
    ا finds أ, in a letter and in a whole word (`hmFold` on both sides).
  - **What is guessed** (the owner, 23 Sep 2026): **one word, or a famous
    name or a film of up to three words - never a sentence**; four words
    are refused. It stays **exactly as it was typed**, **a box a letter**
    (five letters, five boxes) and a gap between words; only the marks that
    aren't letters (diacritics, the tatweel) are dropped. A whole name typed
    without its spaces still counts.
  - **A hint is optional** (the owner, 23 Sep 2026, changing "the word only"
    of the day before): a second field under the word, «تلميح (اختياري)»;
    filled in, the guessers see it as a pill above the boxes (and the TV
    under the title), left empty, nothing. Decided here: at most 30
    characters, and a hint that spells the word out is refused. On one phone
    and in a room alike.
  - **The race deals names and films too** (the owner, 23 Sep 2026): every
    Chameleon entry of up to three words (the actors, footballers, singers,
    historical figures) with its category, and the films of the emoji
    riddles as "a film 🎬" - not their proverbs.
  - Rooms play two ways, a lobby choice, **"one writes, the rest guess" by
    default**: the writer types the word (a word or a name, as above) and,
    if they like, a hint and every other
    phone guesses it **on its own board**; the writer moves round the table.
    Or **a race**: the app deals one word to everyone, **a single word from
    the app's lists with its category as the hint**.
  - Scoring: a solve is **10 plus a bonus by order** (+5, +4 ... +1), **in
    both ways** (the owner, 24 Sep 2026: "each place should get different,
    the first the highest"; until then a writer's word gave every solver a
    flat 10); with a writer, **the writer also scores 5 for every guesser who
    didn't**.
  - **3, 5 or 10 words** a game, the host's choice; a word clock **off by
    default, 60 or 90 seconds**, and when it runs out whoever hasn't solved it
    has failed.
  - Two on one phone: **take turns and a running tally** - one types with the
    letters hidden while the other looks away, the other guesses, then they
    swap, as many words as they like.
  - Decided here: a written word is 3 to 20 letters in one alphabet, no word
    over 12; the race deals a single word of 4 to 9 letters, or a name of up
    to 16 letters whose words are two letters or more; the TV
    shows each player's man and how many letters they have found, never the
    letters; a writer who leaves before writing hands the word to the next;
    fewer than two left ends the game.

### المشنقة

The owner's rules are in *The owner's specs*.

- **`Hangman.js`** (shared, no DOM): `HM_LETTERS` (28 Arabic keys, 26
  English), `hmFold` (the key a letter is typed on), `hmClean`, `hmAlphaOf`,
  `hmWordProblem` (why a written word can't be played), `hmPattern`,
  `hmApply` (one guess, a letter or the whole word, on a board `{ g, miss,
  state }`) and `hmPool(lang)`: the race's words, every single word of 4 to
  9 letters or name of up to three words on the Chameleon boards, with its
  board's category as the hint, and the emoji riddles' films (about 1,200 in
  each language), never a list of its own. `hmShape` is each word's length
  (`shared.shape`, the blanks), `hmPattern` puts a ' ' between words and
  `hmFound` counts letters only.
- **`RoomHangman.js`**: `room._hm` holds the word and every board; each
  guesser's phone gets its own board in `room.secrets[pid]` (its letters,
  its misses and the pattern it shows), the writer's phone the word, and
  `shared.progress` only how far each board is (letters shown, misses,
  solved or hanged, the order of the solves). Phases: `writing` (the host's
  `skipTurn` moves on from a quiet writer), `guessing` (a word ends when
  every board is done, on the clock, or on the host's `closeWord`),
  `result` (the word published, the points banked) and `gameover` after the
  chosen number of words. Guesses carry the word's `round`, so a tap from
  the last word is dropped.
- **The man is a flat cartoon, look أ «كرتون مسطّح»** (the owner, 27 Sep 2026,
  picked from a sheet of three - `notes/archive/sheets/hangman-looks-sheet.html`, the run
  improved in `notes/archive/sheets/hangman-look-a.html`): hair, a face, the game's orange
  shirt, blue trousers, hands and shoes (`--hm-*` tokens, the outlines the
  page's ink), the same six pieces; a new piece pops in from its joint
  (`.hm-pop.is-new`), the pieces not yet earned are drawn hidden (`.hm-ghost`).
  **He talks now and then** (`.hm-bub`, `hm_bub_1..5`: a line a stage, two
  seconds every nine, more desperate with each piece, never on the small
  figures, gone once hanged, freed or stopped). **The escape fits his pieces** (the owner, 28 Sep 2026,
  putting back what the cartoon build had replaced with one run for all): the
  rope snaps and a head alone drops, bounces and rolls off spinning; head and
  body tip over on the body's foot and slide off like a log; arms do an army
  crawl (flat, the head leading, an arm reaching ahead then pulling, the body
  lunging forward on each pull, the arms half a cycle apart, dust behind;
  the owner, 28 Sep 2026: "improve this one"); one leg hops away, higher as he goes (`hm-esc-*`,
  3.2 s, each turning about its own point; the hold and the rows' memory
  cover it). The pieces he never earned stay hidden.
- **The man is alive** (the owner, 27 Sep 2026: "moving, calling for help,
  funny, worse with every part"). Each piece is a group pivoted at its joint
  (`transform-box: view-box`), and `hm-s<n>` on the svg is the state: a
  face fades in with the head and worries more (a smile, flat, a frown with
  brows, a gasp, wide eyes with sweat drops flying); the figure sways from
  two pieces, quicker at four, wriggles at five; the right arm waves at
  three, both flap at four; the legs kick at five. `is-hanged` (six) is
  still: crossed eyes, the tongue out, one shoe dropped (`is-dropping`
  plays the drop once, from `hmAfterBoard`). A found letter is a hop
  (`is-hop`). A solve is the escape (`is-free`): the rope snaps and he
  leaves the way his pieces allow - a head rolls off, a body tips over and
  slides, arms crawl, one leg hops, two legs run; afterwards a won board, a
  TV row and a result row show the gallows empty with the rope cut. A board
  the clock or the host's close ends still guessing is frozen grey with ⏰
  over the head (`hmRoomFx.timeUp` jolts it once); the result card's rows
  carry each player's man (escaped, hanged or frozen) and rise in once. A
  boing (`FX.hmBoing`) per piece and the trombone on the sixth, on the
  guesser's own phone only. Everything is stilled under reduced motion at
  the end of section 25. The table's row of little men (the writer's
  phone, every phone in a race, the TV) plays the moments too: `hmRowMoments`
  compares each board with what this phone last drew and remembers a moment
  with when it began, so a row rebuilt mid-way carries on from there
  (`--hm-late` offsets every one-shot animation). **A word that ends on this
  phone's own last move** (two at the table, the last board done) used to
  jump straight to the result card: `hmRoomHold` keeps the guessing frame
  `HM_HOLD_MS` with the moment on it (the board rebuilt from the last one
  seen and the result's word, the secrets being gone), on the phone and the
  TV, then the result is drawn - the podium, too, for the last word of a game, which
  goes straight to `gameover` (its confetti waits for the hold). The TV's
  signature asks for the hold before its frame (*Traps*). The look driver is `notes/archive/sheets/hangman-look.mjs.txt`.
- **`JS_Hangman.html`**: one board builder for one phone and a room
  (`hmBoardHtml`: the gallows, the tiles, the wrong letters, the keys and the
  whole-word field) and the two on one phone (`appState.hangman`, restored
  through `soloRegister`). The man is six strokes with `pathLength="1"`,
  drawn by letting the dash run out (`hmDrawLast`), a found letter's tile
  turns over, a miss shakes the stage. The tiles stay on one line, shrinking
  for a long word. On a phone on its side and from 900px the drawing and the
  word sit beside the keys, so the whole board is on the screen. The TV
  (`TV_GAMES.hangman`, `data-accent="orange"` so the man keeps the game's
  colour in the room's frame) shows the kind of word, its blanks and every
  player's man.
- **The writing step on one phone** (1 Oct 2026, from the owner's
  before/after sheet) is من أنا؟'s writing layout: `.wa-write` with the
  `.pass-poster` («{name} يكتب كلمة», the name big, the drawn icon), «{name}،
  عينك بعيد عن الشاشة 🙈» under it, then the word in the `.secret-field` with
  👁️ under the label «الكلمة», the rules line, and the hint under «تلميح
  (اختياري)». `hmWriteFormHtml(submit, label, { local: true })` draws that
  form with an id (`hm-write-form`) and no button inside; the bar holds a
  short «جاهزة» (`form="hm-write-form"`, so Enter still submits) with «وبعدها
  ادّي الموبايل لـ{name}» as a small line above it (under it, the line sat
  behind the nav's round button). The room calls `hmWriteFormHtml` without
  the option and keeps its form and button as they were. On a phone on its
  side the bar is one line at the end of the form, not stuck over it.

- **The TV while the writer writes (1 Oct 2026)**: the writing phase on the TV is
  the shared waiting stage `tvWaitStage` (JS_RoomTv.html), as in «one sets,
  everyone solves»: the writer's chip lit, «مستنيين كلمة …» big, the others as big
  chips; the host's move-on buttons stay under it.

**The held end frame shows the word that missed (the review of 1 Oct 2026).** A whole-word guess sets `hmRoom.lastGuess` too (the word, or the one letter typed alone, folded as the server folds it), so a whole-word miss that ends the board shows that word in the held frame, not "?". The TV's signature carries the writer's presence while a word is being written, so the host's ⏭️ shows there at once for a writer who's away.

## The writer's points (the review of 1 Oct 2026)

A word nobody could get paid its writer the most (5 for each guesser hanged). Now the
writer takes 5 for each guesser who didn't solve it **only if at least one guesser solved
it**, and **never more than the best solver took for that word** (`hmEndWord`: `top`, the
highest solver's points, is the ceiling; 15 for a first solve). Help updated in both
languages; `rules.mjs` checks a word nobody solved (0) and four hanged against one solve
(15, not 20). The solve engine's setter (RoomSolve.js) is unchanged.

## The next round (the owner, 2 Oct 2026): built

Picked by the owner from a list of ideas; every rule answered in the session of 2 Oct 2026 (the list below, word for word), built the same day. How each part works:

- **Levels** (`HM_LEVELS`, `hmMaxOf`, `settings.level`, `shared.max`; a board carries `max` when it isn't 6). `hmApply` hangs at `board.max`. The man is the same six pieces drawn in more or fewer steps (`HM_MAN_STEPS`, `hmManOf` in Hangman.js): 4 = head, body, both arms, both legs; 8 = the arms come without their hands and each hand is a miss (`.hm-nohand`, the hand pops in by itself). `hm-s<n>` (the face, the sway) follows how many of the six pieces are up. One phone: the level is a segmented control on the setup screen (`#hangman-level`, `recallOptions('hangmanLocal')`), kept for the game. **Decided here** for the race (`hmLevelFits`): Easy deals single words of 4-6 letters, Hard single words of 6+ and the names and titles, Normal everything as before; Hard sends no category (`shared.cat` empty, the head says «❓ من غير نوع»).
- **The race's category** (`settings.cat`, `HM_CATS`): «من كل حاجة» or one of 12 groups of the Chameleon boards (named by their Arabic titles, the English boards in the same order) or `films` (the emoji riddles' films) - countries & landmarks, animals, food & drink, films, football, singers, actors, famous people, cartoons, home & tools, jobs, sports. `hmPool` tags each entry with its group (`k`); `hmDealFilter` gives `nextPrompts` an `accept` (the category at the level, or the whole category when fewer than 4 fit), one memory with the whole list. The lobby shows them as `.opt-chip`s (race only).
- **Lifelines** (`hmReveal`, `hmRemoveWrong`, room actions `reveal` / `remove` with `round`): each once a word on each board (`board.lr`, `board.lx`). «اكشف حرف» adds a letter of the word to the board's found letters and **never the last one left** (decided here: a lifeline helps, it doesn't solve); «شيل ٣ حروف غلط» greys three untried keys not in the word (`board.x`, struck out; pressing one is nothing). Each used takes `HM_LIFE_COST` (3) off that word's solve (`hmSolvePoints`); the result row shows −3/−6. On one phone the phone decides; in a room the server.
- **The writer's hints**: up to three (`hints` in `setWord`; the old `hint` still works), each ≤30 characters and refused if it spells the word. The first is `shared.cat` (everyone, the TV); the others stay in `room._hm.hints` and reach a guesser's own slice (`you.hints`) on that board's 2nd and 4th miss (`hmHintsOpen`); the writer's slice has all of them; `shared.hintsN` says how many there are, so the board shows a 🔒 pill for each still to come, and the one a miss just opened pops in. The form folds hints 2 and 3 in a `<details>` (`hmMoreHintsHtml`); a half-typed one keeps its fold open across a redraw. Points unchanged.
- **The streak** (`shared.streak` by player, by team `t0`/`t1` in the team way; `appState.hangman.streak` on one phone): +2 for the 2nd solve in a row, +4 the 3rd … `hmStreakBonus` caps at +10; a word not solved (hanged, the clock, the host's close) resets it; the writer's word doesn't touch the writer's. 🔥N beside the name from 2 (`hmFireHtml`) on the board, the rows, the result and the tally.
- **One phone's tally is points now** (so a lifeline and the streak can count): a solve 10 (+ streak − lifelines), a word not solved 10 to its writer - the same one-to-one as the words it counted before; a tally saved before is multiplied by ten once (`s.pts`).
- **Team against team** (`settings.mode: 'teams'`, 4/6/10 words): the host splits the teams in the lobby with vote chess's helpers (`sides` action, `vcFitSides` / `vcRandomSides`; the phone's `hmSidesHtml`, `hmLobbySync`). Word *n* is guessed by team `(n − 1 + firstTeam) % 2` (`shared.gt`); the other team's next writer writes (`wAt`) and this team's next captain taps (`cAt`, `shared.captain`): every guess and lifeline from anyone else is refused («الكابتن بس اللي بيدوس»). One board, the table's (`shared.tb`, built by `hmBoardView`): the team talks it over out loud, so its letters, misses, greyed keys and opened hints are public; the word stays on the writer's phone. **Decided here**: a team's solve is 10 (no order bonus - one board) with the streak and the lifelines, added to every member (so `shared.board`, the night and the program read people) and to `shared.tpts`; a word the team fails scores nobody (both teams write alike; a writer must not gain by an impossible word). `PROGRAM_TEAMS.hangman` (`hmProgramTeams`) places the winning team first, the other second, both first on a draw. A latecomer joins the smaller team with its points so far. A captain who leaves (or is away: the host's «🧢 كابتن تاني», `nextCaptain { round, captain }`) hands the board to the next on the team; a writer to the next on theirs (`skipTurn` too); a team with nobody left ends the game. Play again keeps the teams and the other team guesses first. The TV shows both teams and the board big, its ending playing there.
- **The endings** (`JS_HangmanEnd.html`, all 16 of `notes/archive/sheets/hangman-endings-sheet.html`, the sheet's keyframes ported as they are): whoever holds the word picks one when a board is solved or runs out of misses (`hmGiveEnd` → `board.end`, `progress.end`, `tb.end`; one phone `hmLocalAfter`), never the room's last of that kind nor this player's last (`room._hmEnd`). A board the clock or the host closes keeps the frozen ⏰ man and gets none. `hmManHtml` draws the ending in place of the gallows (the wider stage the props need), the pieces never earned hidden; `hmEndPlay` runs it (a transform per joint, a frame at a time) 2.6-3.2 s, then the last frame holds; the bubbles and the props' words are translated (`hm_end_*`). It plays where it was seen happen (`endPlay`: this phone's solve or last miss, the TV's team board); a redraw carries it on (`hmEndStarts` keyed by the deal, the round and the board), a reload or a late join shows the last frame, and so do the small men (rows, result rows: `hme-svg--mini`, a pop for the moment). Reduced motion: the last frame only. The hold (`hmRoomHold`) keeps the guessing frame 4.5 s for it, in the team way from `shared.tb`. The loss lines are friendly now (😵 «ماحلّهاش», no 💀).
- Tests: `rules.mjs` (levels, categories, lifelines and −3, hints on misses 2 and 4, the streak and its reset and cap, endings never twice in a row, the team way's turns, captain and writer rotation and leaving, its places), `leaks.mjs` (the hints not yet opened, a lifeline's letters, the team board; the driver plays all three ways), `play-all.mjs --only=hangman` (Easy with a category, lifelines, the team way with hints, on phones and a TV).

The owner's answers, word for word:

- **Team against team** (rooms): **a captain taps** the team's letter after talking it over out loud (the captain rotates each word); **one member of the other team writes** the word, rotating, then the teams swap.
- **Levels: Easy 8 misses, Normal 6, Hard 4**, in **every way to play**; the man has more or fewer pieces to match. In the race the level also picks the words' length, and Hard hides the category.
- **The race's category**: **«من كل حاجة»** by default, or **one of the app's lists** (countries, animals, food, films, footballers, singers, actors…), the host's choice.
- **Lifelines**, each **once per word**: «اكشف حرف» and «شيل ٣ حروف غلط»; **each used takes 3 points off that word's score** if solved.
- **The writer's hints, step by step**: up to 3 (all optional); the first shows from the start, the next ones **open on a guesser's 2nd and 4th miss**; points unchanged.
- **Streak**: a solve in a row adds **+2 per word** (2nd +2, 3rd +4 … up to +10); a fail resets it; a 🔥 counter beside the name.
- **Random endings, for wins and losses**: about 5 escapes when solved (runs off, a balloon, a dance, the family pulls him free…) and about 5 friendly cartoon losses (he faints, a pie in the face, stuck upside down…), never grim; the server picks, the same on every phone and the TV, never twice in a row.
- **All 16 endings, not 5 and 5** (the owner, 2 Oct 2026: "apply all, why just 5", from https://claude.ai/artifact/W1SLKhuZahgPhUeuZ1CDn9, `notes/archive/sheets/hangman-endings-sheet.html`): wins فكّ وجري, منطاد الأقصر, التنورة, العيلة شدّته, حمام الغيّة, تحية للجمهور, توكتوك على السريع, مهرجان وصواريخ; losses أغمى عليه, طبق فول طاير, متشعلق بالمقلوب, جردل من البلكونة, اتلف زي الطرد, العربية الكارو, المشنقة اتكسرت, اللقلق خطفه. Each 2.6-3.2 s, then the end frame holds the word.
- **Everywhere they fit**: levels, lifelines, hints and the streak on two-on-one-phone too; teams and categories in rooms.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.

**The endings play as on the sheet (2 Oct 2026, the owner: "not working like it was in the sheet at all").** Two causes: the endings showed only their last frame whenever the device asks for less motion (Windows' "Animation effects" off - the owner's PC - or an iPhone's Reduce Motion), and the board's rows and the room's hold were skipped with it; and a solve kept only the pieces he had earned, so a word solved with no miss played its escape with an empty rope. Now `hmEndsStill()` (JS_HangmanEnd.html) stills them only for the app's own setting (الحركة → مقفولة) or a hidden page - the sheet always played, as the snakes' moves do - and `hmRoomHold` asks the same; every ending has the whole man; and the ending is drawn at `min(20rem, 92%)` of the board, near the sheet's size.

**The lifelines on a narrow phone (2 Oct 2026):** the icons (`.hm-life__ico`) go below 400px wide, so «شيل ٣ حروف غلط» and its −3 keep to one line in their half; the buttons keep the app's sizes.

## The polish (3 Oct 2026, from the owner's before/after sheets)

Picked by the owner from two sheets (https://claude.ai/artifact/V1HJsTHR2hs4u9rrkHcXjL, the screens; https://claude.ai/artifact/QDA7aaGnZan9J5Mn5z9qfD, the endings' last frames): "apply all of them and fix the family one too". Styles in section 66 of `Style_Talk.html`.

- **The board fits on a phone** (H1, the owner chose "small while guessing, full size for the endings"): the misses are dots in the stage's corner (`.hm-pips`, filled one a miss, the new one pops; `hmBoardHtml` puts them in `.hm-stage__miss` with the wrong letters under them, and the "غلطات n من m" line is now only their `aria-label`); upright the gallows is 5.5rem wide while the word is guessed (`.hm-board:not(.is-won):not(.is-lost) .hm-gallows`) and the hints are one line that scrolls sideways. An ending is drawn by `.hme-svg`, which keeps its full size. Once the word is over the dots and letters go under the word (`order: 3`), so the ending has the stage's width. Letters, both lifelines and the guess box are all on a 375 × 812 screen, on one phone and in rooms.
- **A phone on its side** (H2): one phone's tally joins the title line (`.hm-score-line`, shown only there, the tally row hidden), the hints are one line, the keys 2rem high, the lifelines without their icons and on one line; the result card is part of the board now (`o.after` in `hmBoardHtml`, `.hm-after`), so on a phone on its side and from 900px it takes the keys' empty column (grid row 2-5, column 2) with «الكلمة الجاية» on the screen. The room's own "you solved it / wait" card goes the same way.
- **Hint pills** (H4): no number in a pill; a locked one is dashed and says how many misses are left before it opens (`hm_hint_in_1`, `hm_hint_in_2`, `hm_hint_in`; `hm_hint_locked` is gone).
- **The letter «اكشف حرف» bought is marked** (H5): `board.lr` is now the letter it showed (`hmReveal`, truthy as `true` was; `hmBoardView` passes it on), its key amber with a 🔍 (`.hm-key--bought`) and its tile dashed amber (`.hm-tile.is-bought`).
- **The TV** (H6, H7): the players' cards are centred - `auto-fit`, not `auto-fill`, whose empty tracks held them to one side (Style_Arcade) - and bigger; the result's kind of word, hints, rows and men are TV sized, each name beside its man.
- **"Look away"** (H8): the writing step's «… عينك بعيد عن الشاشة» is a banner in the game's colour.
- **How many misses** (the owner, 3 Oct 2026: an ending draws the whole man, so the man no longer tells): `hmMissDots` draws a board's misses as small dots on the table's rows (phone and TV) and on the result's rows.
- **The endings' last frame** (`JS_HangmanEnd.html`): what must not outlive an ending - the dust (`fill="var(--hm-dust)"`) and the feathers (`fe1`, `fe2`) - fades over its last 320 ms (`c.fade` in `rig`, applied in `draw`): فكّ وجري and توكتوك left puffs frozen on the floor and حمام الغيّة a feather in mid-air. The six where he leaves the frame (`leave: true`: فكّ وجري, منطاد الأقصر, حمام الغيّة, توكتوك, العربية الكارو, اللقلق) fade in a `trace` over their last 450 ms - footprints and dust, the balloon in the sky, the pigeons up high and a feather on the floor, the tuk-tuk and the cart at the edge they left by, the stork far away - and swap the rope for a cut, frayed one (`CUT`). After the ending the last frame lives (`idleStart` / `idle`, about 30 frames a second, only full-size drawings - the ones with a bubble - only while on the page, never with the app's الحركة → مقفولة): he bobs and blinks, the family bobs with him, the spotlight shimmers; a leaving ending's cut rope swings and its trace drifts. A 🔁 in the stage's bottom corner (`hmManHtml`, `hmEndReplay` → `HM_END.replay`) plays the ending again on that device only; it isn't drawn when motion is off. العيلة شدّته's family stops 12 units further left and lifts him at x 49, so he stays inside the drawing (he was cut by its right edge).

**Three losses replaced (3 Oct 2026, the owner: "remove the ones that don't fit, like العربية الكارو in losing - what is the point of it"; "if you have new ideas apply it").** العربية الكارو (a donkey cart carries him off), المشنقة اتكسرت (the gallows breaks and frees him) and اللقلق خطفه (a stork lifts him away) read as a ride, a rescue and a lift, not as losing. In their places, the same slots (`LOSSES[5..7]`, so the server's picks and `HM_ENDS` are unchanged): **سحابة على راسه** - a little grey cloud drifts in over his head and rains on him alone (a flash once), follows him down when the rope gives and he ends sitting soaked in a puddle, «ليه أنا بالذات؟!» then «مش يومي النهارده»; **طماطم من الجمهور** - four heads at the edge boo («بوووووو!»), three tomatoes fly in one after another and stay on him as red marks (shirt, shirt, hair), he drops, wipes his face with a sleeve and crosses his arms, «كنت قرّبت والله!»; **الأرض بلعته** - a hole opens under him and he sinks right into the floor, then his eyes blink in the dark of the hole and one hand comes up out of it and waves, «حد يرميلي سلّم!» (a floor-coloured strip in front hides what is under the floor). In the idle after the ending the cloud drifts, the hand keeps waving and the eyes blink. The eight wins were kept: each is an escape or a rescue. `hm_end_crack` and the broken gallows' `broken` handling are gone; the three are no longer `leave` endings.
