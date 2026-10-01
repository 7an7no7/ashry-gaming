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
  picked from a sheet of three - `notes/hangman-looks-sheet.html`, the run
  improved in `notes/hangman-look-a.html`): hair, a face, the game's orange
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
  signature asks for the hold before its frame (*Traps*). The look driver is `notes/hangman-look.mjs.txt`.
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

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
